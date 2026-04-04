import { ipcMain } from "electron";
import { onIpc } from "./helpers";
import { MESSAGE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { agentChatBridge } from "@/electron/chatGateway/bridge";
import { LLMProvider } from "@/electron/type";
import type { IAttachedFileContext } from "@/electron/appAgent";
import type {
  IpcAgentCreateSessionPayload,
  IpcAgentRunPayload,
  IpcAgentStopPayload,
  IpcAgentResetSessionPayload,
  IpcAgentChangeProviderPayload,
  IpcAgentGetStatusPayload,
  IpcAgentDestroySessionPayload,
} from "@/electron/ipcTypes";
import { hasApiKey } from "@/electron/appAgent";

const CONTEXT_HEADER = "CURRENT CONTEXT (use these values";

/**
 * Parses the context JSON block appended by AgentView to every user message
 * and returns the fields relevant for tool injection.
 */
const parseToolContextFromInput = (
  input: string,
): {
  nodeEndpointGroupId?: number;
  encryptKey?: string;
  listCampaignProfileId?: number[];
  isAllWallet?: boolean;
  tokenAddress?: string;
  campaignId?: number;
  chainKey?: string;
  attachedFiles?: IAttachedFileContext[];
} => {
  try {
    const idx = input.indexOf(CONTEXT_HEADER);
    if (idx === -1) {
      return {};
    }
    const rest = input.slice(idx);
    const jsonStart = rest.indexOf("{");
    const jsonEnd = rest.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return {};
    }
    const ctx = JSON.parse(rest.slice(jsonStart, jsonEnd + 1));
    const attachedFiles: IAttachedFileContext[] | undefined = Array.isArray(
      ctx.attachedFiles,
    )
      ? ctx.attachedFiles.filter(
          (file: unknown): file is IAttachedFileContext =>
            file != null &&
            typeof file === "object" &&
            typeof (file as IAttachedFileContext).filePath === "string",
        )
      : undefined;
    return {
      nodeEndpointGroupId:
        typeof ctx.nodeEndpointGroupId === "number"
          ? ctx.nodeEndpointGroupId
          : undefined,
      listCampaignProfileId: Array.isArray(ctx.listCampaignProfileId)
        ? ctx.listCampaignProfileId.filter(
            (id: unknown) => typeof id === "number",
          )
        : undefined,
      isAllWallet:
        typeof ctx.isAllWallet === "boolean" ? ctx.isAllWallet : undefined,
      tokenAddress:
        typeof ctx.tokenAddress === "string" && ctx.tokenAddress
          ? ctx.tokenAddress
          : undefined,
      campaignId:
        typeof ctx.campaignId === "number" ? ctx.campaignId : undefined,
      chainKey:
        typeof ctx.chainKey === "string" && ctx.chainKey
          ? ctx.chainKey
          : undefined,
      attachedFiles,
    };
  } catch {
    return {};
  }
};

const createResponse = (
  event: Electron.IpcMainEvent,
  channel: string,
  data: any,
) => event.reply(channel, data);

/** Debounced agent recreation — waits for toggles to settle before recreating. */
let recreateTimer: ReturnType<typeof setTimeout> | null = null;
const RECREATE_DEBOUNCE_MS = 800;

export const recreateAllAgents = () => {
  if (recreateTimer) {
    clearTimeout(recreateTimer);
  }
  recreateTimer = setTimeout(() => {
    recreateTimer = null;
    agentChatBridge.recreateAllSessions();
  }, RECREATE_DEBOUNCE_MS);
};

export const cleanupAllAgentSessions = async () => {
  await agentChatBridge.cleanupAll();
};

export const agentController = () => {
  // Pre-warm: create a session and start agent init immediately on app startup
  agentChatBridge.prewarmSession(LLMProvider.CLAUDE);

  // returns pre-warmed session if available
  onIpc<IpcAgentCreateSessionPayload>(
    MESSAGE.DASHBOARD_AGENT_CREATE_SESSION,
    MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES,
    async (event, payload) => {
      const requestedProvider: LLMProvider =
        payload?.provider || LLMProvider.CLAUDE;

      const { sessionId, session } =
        await agentChatBridge.createIpcSession(requestedProvider);

      const keyExists = await hasApiKey(session.provider);
      createResponse(event, MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES, {
        data: {
          sessionId,
          agentReady: !!session.keeper,
          noApiKey: !keyExists,
          ...(session.keeper && {
            subAgentsCount: session.keeper.subAgentsCount,
            toolsCount: session.keeper.toolsCount,
            skillsCount: session.keeper.skillsCount,
          }),
        },
      });
    },
  );

  onIpc<IpcAgentRunPayload>(
    MESSAGE.DASHBOARD_AGENT_RUN,
    MESSAGE.DASHBOARD_AGENT_RUN_RES,
    async (event, payload) => {
      const { sessionId, input, encryptKey } = payload || {};

      try {
        if (!sessionId) {
          throw new Error("sessionId is required");
        }
        if (typeof input !== "string" || input.trim().length === 0) {
          throw new Error("input must not be empty");
        }

        const session = agentChatBridge.getSession(sessionId);
        if (!session) {
          throw new Error("Session not found or has expired");
        }

        // Parse context from user message and inject into tools before running.
        // encryptKey is passed via a separate IPC field (never embedded in message text).
        const parsedCtx = parseToolContextFromInput(input);
        if (encryptKey) {
          parsedCtx.encryptKey = encryptKey;
        }
        session.toolContext.update(parsedCtx);

        const result = await agentChatBridge.runAgent(sessionId, input, {
          ipcEvent: event,
          attachedFiles: parsedCtx.attachedFiles,
        });

        createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
          data: {
            output: result.output,
            steps: result.steps,
            stopped: result.stopped,
            isError: result.isError,
            errorMsg: result.errorMsg,
          },
          sessionId,
        });
      } catch (err: any) {
        const errorMsg = err?.message || "Failed to run agent";
        logEveryWhere({
          message: `[AgentController] Run error: ${errorMsg}`,
        });
        createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
          data: {
            output: `Error: ${errorMsg}`,
            steps: [],
            isError: true,
            errorMsg,
          },
          sessionId,
        });
      }
    },
  );

  // stop the running agent
  onIpc<IpcAgentStopPayload>(
    MESSAGE.DASHBOARD_AGENT_STOP,
    MESSAGE.DASHBOARD_AGENT_STOP_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      if (sessionId) {
        agentChatBridge.stopAgent(sessionId);
      }
      createResponse(event, MESSAGE.DASHBOARD_AGENT_STOP_RES, {
        data: { sessionId },
      });
    },
  );

  // cleanup old agent
  onIpc<IpcAgentResetSessionPayload>(
    MESSAGE.DASHBOARD_AGENT_RESET_SESSION,
    MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      await agentChatBridge.resetSession(sessionId);
      createResponse(event, MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES, {
        data: { sessionId },
      });
    },
  );

  // cleanup old agent, recreate with new provider
  onIpc<IpcAgentChangeProviderPayload>(
    MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER,
    MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES,
    async (event, payload) => {
      const { sessionId, provider } = payload || {};
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      if (!provider) {
        throw new Error("provider is required");
      }
      await agentChatBridge.changeProvider(sessionId, provider);
      createResponse(event, MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES, {
        data: { sessionId, provider },
      });
    },
  );

  // renderer polls this when agentReady is false
  onIpc<IpcAgentGetStatusPayload>(
    MESSAGE.DASHBOARD_AGENT_GET_STATUS,
    MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      const session = sessionId
        ? await agentChatBridge.getStatus(sessionId)
        : null;

      createResponse(event, MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES, {
        data: {
          sessionId,
          ready: !!session?.keeper,
          ...(session?.keeper && {
            subAgentsCount: session.keeper.subAgentsCount,
            toolsCount: session.keeper.toolsCount,
            skillsCount: session.keeper.skillsCount,
          }),
        },
      });
    },
  );

  onIpc<IpcAgentDestroySessionPayload>(
    MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION,
    MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      await agentChatBridge.destroySession(sessionId);
      createResponse(event, MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION_RES, {
        data: { sessionId },
      });
    },
  );

  ipcMain.on(
    MESSAGE.DASHBOARD_AGENT_PLAN_APPROVAL,
    (_event, payload: { sessionId: string; approved: boolean }) => {
      const { sessionId, approved } = payload || {};
      const resolve = agentChatBridge.pendingPlanApprovals.get(sessionId);
      if (resolve) {
        resolve(approved === true);
        agentChatBridge.pendingPlanApprovals.delete(sessionId);
      }
    },
  );
};
