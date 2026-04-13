/*
  WhatsAppService — Manages a single WhatsApp connection via Baileys.

  - Auth state (credentials + signal keys) is stored in the Preference table.
    After the first QR scan, subsequent connections reuse the saved session automatically.
  - Emits QR codes to the renderer so the user can scan from the WhatsApp app.
  - On successful connection, registers a WhatsAppChatAdapter with the AgentChatBridge
    so that regular text messages are forwarded to the KeeperAgent.
  - Only agent chat is supported — no workflow integration.
*/

import {
  makeWASocket,
  fetchLatestBaileysVersion,
  Browsers,
  type WASocket,
} from "@whiskeysockets/baileys";
import { logEveryWhere } from "@/electron/service/util";
import { mainWindow } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { agentChatBridge } from "@/electron/chatGateway/bridge";
import {
  ChatPlatform,
  WhatsAppStatus,
  IPlatformMessage,
} from "@/electron/chatGateway/types";
import { preferenceService } from "@/electron/service/preference";
import { createWhatsAppChatAdapter } from "./chatAdapter";
import type { WhatsAppChatAdapter } from "./chatAdapter";

const silentLogger = {
  level: "silent",
  child: () => silentLogger,
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
} as any;

class WhatsAppService {
  private socket: WASocket | null = null;
  private chatAdapter: WhatsAppChatAdapter | null = null;
  private isStarting = false;
  private hasReceivedCreds = false;
  // Track recent message IDs sent by the agent to avoid processing them as user input
  private sentMessageIds: string[] = [];
  private readonly maxSentIds = 50;

  /** Push current status to the renderer. */
  emitStatus = () => {
    if (this.socket && !this.isStarting) {
      this.notifyStatus(WhatsAppStatus.CONNECTED);
    } else if (this.isStarting) {
      this.notifyStatus(WhatsAppStatus.CONNECTING);
    } else {
      this.notifyStatus(WhatsAppStatus.DISCONNECTED);
    }
  };

  /* Called on app startup — only connects if isWhatsAppOn is true. */
  start = async () => {
    try {
      const [preference] = await preferenceService.getOnePreference();
      if (!preference?.isWhatsAppOn) {
        logEveryWhere({ message: "[WhatsApp] WhatsApp is not enabled" });
        return;
      }
      await this.initSocket();
    } catch (err: any) {
      logEveryWhere({
        message: `[WhatsApp] start() error: ${err?.message}`,
      });
    }
  };

  connect = async () => {
    if (this.isStarting) {
      return;
    }
    this.isStarting = true;

    try {
      await this.stopSocket();
      // Clear stale auth so we always get a fresh QR on user-initiated connect
      await preferenceService.clearWhatsAppAuthState();
      await this.initSocket();
    } catch (err: any) {
      this.isStarting = false;
      logEveryWhere({
        message: `[WhatsApp] connect() error: ${err?.message}`,
      });
    }
  };

  disconnect = async () => {
    await this.stopSocket();
    const [preference] = await preferenceService.getOnePreference();
    if (preference && preference.isWhatsAppOn) {
      await preferenceService.updatePreference({
        id: preference.id,
        isWhatsAppOn: false,
      });
    }
  };

  private stopSocket = async () => {
    if (this.socket) {
      try {
        this.socket.end(undefined);
      } catch {}
      this.socket = null;
    }
    this.chatAdapter = null;
    this.notifyStatus(WhatsAppStatus.DISCONNECTED);
  };

  private initSocket = async () => {
    const { state, saveCreds } = await preferenceService.getWhatsAppAuthState();
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp] Creating socket with version ${version.join(".")}`);

    const socket = makeWASocket({
      auth: state,
      version,
      browser: Browsers.appropriate("Keeper Agent"),
      logger: silentLogger,
    });

    this.socket = socket;

    this.hasReceivedCreds = false;
    socket.ev.on("creds.update", () => {
      this.hasReceivedCreds = true;
      saveCreds();
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logEveryWhere({ message: "[WhatsApp] QR code received" });
        this.notifyStatus(WhatsAppStatus.CONNECTING);
        mainWindow?.webContents?.send(MESSAGE.WHATSAPP_QR, { qr });
      }

      if (connection === "open") {
        this.isStarting = false;
        logEveryWhere({ message: "[WhatsApp] Connected" });
        this.notifyStatus(WhatsAppStatus.CONNECTED);
        this.registerAdapter();

        // Auto-save preference so it reconnects on next app start
        const [preference] = await preferenceService.getOnePreference();
        if (preference && !preference.isWhatsAppOn) {
          await preferenceService.updatePreference({
            id: preference.id,
            isWhatsAppOn: true,
          });
        }
      }

      if (connection === "close") {
        const lastError = lastDisconnect?.error as any;
        const statusCode =
          lastError?.output?.statusCode || lastError?.statusCode;

        logEveryWhere({
          message: `[WhatsApp] Connection closed — status ${statusCode}, error: ${lastError?.message}`,
        });

        this.isStarting = false;
        this.socket = null;
        this.chatAdapter = null;

        if (statusCode === 515) {
          if (this.hasReceivedCreds) {
            // Fresh credentials just saved after QR scan — WhatsApp requires a reconnect
            logEveryWhere({
              message:
                "[WhatsApp] Reconnecting with fresh credentials after stream restart",
            });
            try {
              await this.initSocket();
            } catch (reconnectError: any) {
              logEveryWhere({
                message: `[WhatsApp] Reconnect after stream restart failed: ${reconnectError?.message}`,
              });
              this.hasReceivedCreds = false;
              this.notifyStatus(WhatsAppStatus.DISCONNECTED);
            }
            return;
          } else {
            // No credentials — stale session, clear auth so next connect gets a fresh QR
            await preferenceService.clearWhatsAppAuthState();
            logEveryWhere({
              message: "[WhatsApp] Cleared stale auth state after stream error",
            });
          }
        }

        this.notifyStatus(WhatsAppStatus.DISCONNECTED);
      }
    });

    socket.ev.on("messages.upsert", (upsert) => {
      if (upsert.type !== "notify") {
        return;
      }

      for (const message of upsert.messages) {
        if (!message.key.fromMe) {
          continue;
        }
        if (message.key.remoteJid === "status@broadcast") {
          continue;
        }
        // Skip messages sent by the agent to avoid loop
        const messageId = message.key.id || "";
        const sentIndex = this.sentMessageIds.indexOf(messageId);
        if (messageId && sentIndex !== -1) {
          this.sentMessageIds.splice(sentIndex, 1);
          continue;
        }

        const text =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          "";

        if (!text.trim()) {
          continue;
        }

        const chatId = message.key.remoteJid || "";
        const userId = message.key.participant || chatId;

        const platformMessage: IPlatformMessage = {
          platformId: ChatPlatform.WHATSAPP,
          chatId,
          userId,
          text,
          messageId: message?.key?.id || undefined,
        };

        if (this.chatAdapter) {
          this.chatAdapter.receive(platformMessage).catch((receiveErr: any) => {
            logEveryWhere({
              message: `[WhatsApp] Message receive error: ${receiveErr?.message}`,
            });
          });
        }
      }
    });
  };

  private registerAdapter = () => {
    if (this.chatAdapter) {
      return;
    }

    const adapter = createWhatsAppChatAdapter();

    adapter.setSendText(async (chatId, text) => {
      if (this.socket) {
        const sent = await this.socket.sendMessage(chatId, { text });
        if (sent?.key?.id) {
          this.sentMessageIds.push(sent.key.id);
          if (this.sentMessageIds.length > this.maxSentIds) {
            this.sentMessageIds.shift();
          }
        }
      }
    });

    adapter.setSendPresence(async (chatId) => {
      if (this.socket) {
        await this.socket.sendPresenceUpdate("composing", chatId);
      }
    });

    agentChatBridge.registerAdapter(adapter);
    this.chatAdapter = adapter;
  };

  private notifyStatus = (status: WhatsAppStatus) => {
    mainWindow?.webContents?.send(MESSAGE.WHATSAPP_STATUS, { status });
  };
}

export const whatsappService = new WhatsAppService();
