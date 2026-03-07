import crypto from "crypto";
import {
  IProxyProvider,
  IProxyClient,
  IProxyInfo,
  IProxyRes,
  APIKeyConfig,
} from "./repo";
import { proxyDB } from "@/electron/database/proxy";
import { IProxy } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { StopSignal } from "@/electron/simulator/stopSignal";
import { MESSAGE } from "@/electron/constant";
import { sendToRenderer } from "@/electron/main";

interface ProxySession {
  sessionId: string;
  apiKey: string;
  proxyInfo: IProxyInfo;
  profileKeys: Set<string>;
}

export class ProxyProvider implements IProxyProvider {
  private client: IProxyClient;
  private serviceName: string;
  private serviceType: string;
  private stopSignal: StopSignal;

  private listApiKey: APIKeyConfig[] = [];
  private listInvalidApiKey: string[] = [];
  private currentKeyIndex = 0;
  private isRunning = false;
  private campaignId = 0;
  private workflowId = 0;

  /** sessionId -> ProxySession */
  private sessions = new Map<string, ProxySession>();
  /** profileKey -> sessionId */
  private profileToSession = new Map<string, string>();

  constructor(
    client: IProxyClient,
    serviceName: string,
    serviceType: string,
    stopSignal: StopSignal,
  ) {
    this.client = client;
    this.serviceName = serviceName;
    this.serviceType = serviceType;
    this.stopSignal = stopSignal;
  }

  startProxyProvider = async (
    campaignId: number,
    workflowId: number,
  ): Promise<void> => {
    const [res, err] = await proxyDB.getListProxy({
      page: 0,
      pageSize: 10000,
      type: this.serviceType,
    });
    if (err || !res) return;

    const { data = [] } = res;
    logEveryWhere({
      campaignId,
      workflowId,
      message: `${this.serviceName} start provider, listProxy: ${JSON.stringify(
        data,
      )}`,
    });

    this.listApiKey = data?.map((apiKey: IProxy) => ({
      value: apiKey?.apiKey!,
    }));
    this.isRunning = true;
    this.campaignId = campaignId;
    this.workflowId = workflowId;
  };

  stopProxyProvider = () => {
    if (this.isRunning) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        message: `Stop ${this.serviceName}`,
      });
    }
    this.sessions.clear();
    this.profileToSession.clear();
    this.listApiKey = [];
    this.listInvalidApiKey = [];
    this.currentKeyIndex = 0;
    this.campaignId = 0;
    this.workflowId = 0;
    this.isRunning = false;
  };

  getAProxy = async (
    profileKey: string,
    maxProfilePerProxy: number,
    campaignId: number,
    workflowId: number,
  ): Promise<IProxyRes> => {
    if (!this.isRunning) {
      await this.startProxyProvider(campaignId, workflowId);
    }

    if (this.stopSignal.shouldStop(profileKey)) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        message: `${this.serviceName} stop when receive stop signal, profileKey: ${profileKey}`,
      });
      return { proxy: null, error: null };
    }

    // All API keys invalid
    if (
      this.listApiKey.length > 0 &&
      this.listInvalidApiKey.length === this.listApiKey.length
    ) {
      sendToRenderer(MESSAGE.ALL_PROXY_API_KEY_INVALID, {
        data: this.serviceName,
      });
      return { proxy: null, error: null };
    }

    // 1. If profile already has a session, return it
    const existingSessionId = this.profileToSession.get(profileKey);
    if (existingSessionId) {
      const session = this.sessions.get(existingSessionId);
      if (session) {
        return { proxy: session.proxyInfo, error: null };
      }
      // Session was cleaned up, remove stale mapping
      this.profileToSession.delete(profileKey);
    }

    // 2. Find existing session with room
    for (const session of this.sessions.values()) {
      if (session.profileKeys.size < maxProfilePerProxy) {
        session.profileKeys.add(profileKey);
        this.profileToSession.set(profileKey, session.sessionId);
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          message: `${this.serviceName} reuse session ${session.sessionId} for ${profileKey} (${session.profileKeys.size}/${maxProfilePerProxy})`,
        });
        return { proxy: session.proxyInfo, error: null };
      }
    }

    // 3. Create new session with next API key
    const apiKey = this.getNextValidApiKey();
    if (!apiKey) {
      sendToRenderer(MESSAGE.ALL_PROXY_API_KEY_INVALID, {
        data: this.serviceName,
      });
      return { proxy: null, error: null };
    }

    try {
      const sessionId = crypto.randomUUID();
      const proxyInfo = this.client.buildProxyInfo(apiKey, sessionId);

      const session: ProxySession = {
        sessionId,
        apiKey,
        proxyInfo,
        profileKeys: new Set([profileKey]),
      };

      this.sessions.set(sessionId, session);
      this.profileToSession.set(profileKey, sessionId);

      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        message: `${this.serviceName} new session ${sessionId} for ${profileKey}`,
      });

      return { proxy: proxyInfo, error: null };
    } catch (err: any) {
      return {
        proxy: null,
        error: err?.message,
      };
    }
  };

  markProxyIsUnUsed = (profileKey: string) => {
    const sessionId = this.profileToSession.get(profileKey);
    if (!sessionId) return;

    this.profileToSession.delete(profileKey);

    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.profileKeys.delete(profileKey);

    // If no profiles use this session, clean it up
    if (session.profileKeys.size === 0) {
      this.sessions.delete(sessionId);
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        message: `${this.serviceName} removed empty session ${sessionId}`,
      });
    }
  };

  isApiKeyAlive = async (apiKey: string): Promise<boolean> => {
    return await this.client.isApiKeyAlive(apiKey);
  };

  private getNextValidApiKey = (): string | null => {
    const total = this.listApiKey.length;
    for (let i = 0; i < total; i++) {
      const idx = (this.currentKeyIndex + i) % total;
      const key = this.listApiKey[idx].value;
      if (!this.listInvalidApiKey.includes(key)) {
        this.currentKeyIndex = (idx + 1) % total;
        return key;
      }
    }
    return null;
  };
}
