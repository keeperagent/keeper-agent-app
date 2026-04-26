import { ipcMain } from "electron";
import { onIpc } from "./helpers";
import { MESSAGE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { agentChatBridge } from "@/electron/chatGateway/bridge";
import { agentProfileChatBridge } from "@/electron/chatGateway/agentProfileBridge";
import { LLMProvider } from "@/electron/type";
import type { IAttachedFileContext } from "@/electron/agentCore";
import type {
  IpcAgentCreateSessionPayload,
  IpcAgentRunPayload,
  IpcAgentStopPayload,
  IpcAgentResetSessionPayload,
  IpcAgentChangeProviderPayload,
  IpcAgentGetStatusPayload,
  IpcCheckModelCapabilityPayload,
} from "@/electron/ipcTypes";
import { checkModelCapability } from "@/electron/service/modelCapability";
import { hasApiKey } from "@/electron/agentCore";
import { experienceRecorder } from "@/electron/agentCore/experienceEngine/experienceRecorder";

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
  await agentProfileChatBridge.cleanupAll();
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
      const agentProfileId = payload?.agentProfileId ?? null;

      const { sessionId, session } = await agentChatBridge.createIpcSession(
        requestedProvider,
        agentProfileId,
      );

      const keyExists = await hasApiKey(session.provider);
      createResponse(event, MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES, {
        data: {
          sessionId,
          agentReady: Boolean(session.agent),
          noApiKey: !keyExists,
          ...(session.agent && {
            subAgentsCount: session.agent.subAgentsCount,
            toolsCount: session.agent.toolsCount,
            skillsCount: session.agent.skillsCount,
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
          rawUserMessage: input,
        });

        // Record experience non-blocking
        experienceRecorder
          .record({
            runId: result.runId,
            userMessage: input,
            toolCallSequence:
              result.steps.length > 0
                ? JSON.stringify(result.steps.map((step) => step.toolName))
                : null,
            todoTemplate: result.todoTemplate,
            isSuccess: !result.isError && !result.stopped,
            errorMsg: result.errorMsg,
            provider: session.provider,
          })
          .catch(() => {});

        createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
          data: {
            output: result.output,
            steps: result.steps,
            stopped: result.stopped,
            isError: result.isError,
            errorMsg: result.errorMsg,
            runId: result.runId,
            todoTemplate: result.todoTemplate,
            turnUsage: result.turnUsage,
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
          ready: !!session?.agent,
          ...(session?.agent && {
            subAgentsCount: session.agent.subAgentsCount,
            toolsCount: session.agent.toolsCount,
            skillsCount: session.agent.skillsCount,
          }),
        },
      });
    },
  );

  onIpc<IpcCheckModelCapabilityPayload>(
    MESSAGE.CHECK_MODEL_CAPABILITY,
    MESSAGE.CHECK_MODEL_CAPABILITY_RES,
    async (event, payload) => {
      const { modelName, provider, requestId } = payload || {};
      const capability = await checkModelCapability(modelName || "", provider);
      event.reply(MESSAGE.CHECK_MODEL_CAPABILITY_RES, {
        data: capability,
        requestId,
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
