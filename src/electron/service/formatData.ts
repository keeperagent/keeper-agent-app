import { Model } from "sequelize";
import _ from "lodash";
import {
  ICampaign,
  ICampaignProfile,
  IMcpServer,
  IAgentProfile,
  IAgentMailbox,
  IProfile,
  IProfileGroup,
  IResource,
  IResourceGroup,
  ISchedule,
  IJob,
  IWorkflow,
  IAgentTask,
  ISetting,
  SETTING_TYPE,
  IGeneralSetting,
  ILlmSetting,
  IDexSetting,
  ITelegramSetting,
  IWhatsAppSetting,
  IMasterPasswordSetting,
  McpTokenPermission,
} from "@/electron/type";
import { encryptionService } from "./encrypt";

const formatDBResponse = (data: Model<any, any>): any => {
  let formatedData = data as any;

  // try to parse data
  try {
    formatedData = data?.toJSON();
    return formatedData;
  } catch {}

  // try to parse data
  try {
    if (data?.dataValues) {
      formatedData = data?.dataValues;
      return formatedData;
    }
  } catch {}

  return formatedData;
};

const formatProfileGroup = (data: Model<any, any>): IProfileGroup => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listResourceGroup:
      formatedData?.ResourceGroups?.map((resourceGroup: any) =>
        formatDBResponse(resourceGroup),
      ) || [],
    walletGroup: formatDBResponse(formatedData?.walletGroup),
  };
  formatedData = _.omit(formatedData, ["Extensions", "ResourceGroups"]);

  let profileGroup: IProfileGroup = formatedData;
  profileGroup = {
    ...profileGroup,
    listResourceGroupId: _.map(
      profileGroup?.listResourceGroup,
      (extension: IResourceGroup) => extension?.id!,
    ),
  };
  return profileGroup;
};

const formatResourceGroup = (data: Model<any, any>): IResourceGroup => {
  let formatData = formatDBResponse(data);
  formatData = {
    ...formatData,
    listProfileGroup:
      formatData?.ProfileGroups?.map((profileGroup: any) =>
        formatDBResponse(profileGroup),
      ) || [],
  };
  return formatData;
};

const formatCampaign = (data: Model<any, any>): ICampaign => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listWorkflow:
      formatedData?.Workflows?.map((workflow: any) =>
        formatWorkflow(workflow),
      ) || [],
    listExtension:
      formatedData?.Extensions?.map((extension: any) =>
        formatDBResponse(extension),
      ) || [],
    listCampaignProfile: formatedData?.CampaignProfiles || [],
  };
  formatedData = _.omit(formatedData, [
    "Workflows",
    "Extensions",
    "CampaignProfiles",
  ]);
  let campaign: ICampaign = formatedData;

  campaign = {
    ...campaign,
    listWorkflowId: _.map(
      campaign?.listWorkflow,
      (workflow: IWorkflow) => workflow?.id!,
    ),
    listCampaignProfileId: _.map(
      campaign?.listCampaignProfile,
      (campaignProfile: ICampaignProfile) => campaignProfile?.id!,
    ),
    profileGroup: formatProfileGroup(formatedData?.profileGroup),
    proxyGroup: formatDBResponse(formatedData?.proxyGroup),
    listColumnForCalculate: campaign?.listColumnForCalculate
      ? JSON.parse(campaign?.listColumnForCalculate?.toString())
      : [],
  };

  return campaign;
};

const formatWorkflow = (data: Model<any, any>): IWorkflow => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listExtension:
      formatedData?.Extensions?.map((extension: any) =>
        formatDBResponse(extension),
      ) || [],
    listVariable:
      typeof formatedData?.listVariable === "string"
        ? JSON.parse(formatedData?.listVariable || "[]")
        : formatedData?.listVariable,
  };
  formatedData = _.omit(formatedData, ["Extensions"]);
  const workflow: IWorkflow = formatedData;

  return workflow;
};

const formatCampaignProfile = (data: Model<any, any>): ICampaignProfile => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listResource: formatedData?.Resources || [],
  };
  formatedData = _.omit(formatedData, ["Resources"]);

  let profile: ICampaignProfile = formatedData;
  if (profile?.wallet) {
    profile = {
      ...profile,
      wallet: {
        ...profile?.wallet,
        isOriginalEncrypted: profile?.wallet?.isEncrypted,
      },
    };
  }
  if (profile?.listResource) {
    profile = {
      ...profile,
      listResource: profile?.listResource?.map((resource) => ({
        ...resource,
        isOriginalEncrypted: resource?.isEncrypted,
      })),
      listResourceId: _.map(
        profile?.listResource,
        (resource: IResource) => resource?.id!,
      ),
    };
  }

  return profile;
};

const formatProfile = (data: Model<any, any>): IProfile => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listResource: formatedData?.Resources || [],
  };
  formatedData = _.omit(formatedData, ["Resources"]);

  let profile: IProfile = formatedData;
  if (profile?.wallet) {
    profile = {
      ...profile,
      wallet: {
        ...profile?.wallet,
        isOriginalEncrypted: profile?.wallet?.isEncrypted,
      },
    };
  }
  if (profile?.listResource) {
    profile = {
      ...profile,
      listResource: profile?.listResource?.map((resource) => ({
        ...resource,
        isOriginalEncrypted: resource?.isEncrypted,
      })),
      listResourceId: _.map(
        profile?.listResource,
        (resource: IResource) => resource?.id!,
      ),
    };
  }

  return profile;
};

const formatMcpServer = (data: any): IMcpServer => {
  const formatedData = formatDBResponse(data);
  return {
    ...formatedData,
    disabledTools:
      typeof formatedData?.disabledTools === "string"
        ? JSON.parse(formatedData?.disabledTools || "[]")
        : formatedData?.disabledTools || [],
  };
};

const formatAgentProfile = (data: any): IAgentProfile => {
  let formatedData = formatDBResponse(data);
  const hasEncryptKey = Boolean(formatedData?.encryptKey);
  formatedData = _.omit(formatedData, ["encryptKey"]);
  return {
    ...formatedData,
    allowedBaseTools:
      typeof formatedData?.allowedBaseTools === "string"
        ? JSON.parse(formatedData?.allowedBaseTools || "[]")
        : formatedData?.allowedBaseTools || [],
    allowedMcpServerIds:
      typeof formatedData?.allowedMcpServerIds === "string"
        ? JSON.parse(formatedData?.allowedMcpServerIds || "[]").map(
            (item: any) => Number(item),
          )
        : formatedData?.allowedMcpServerIds || [],
    allowedSkillIds:
      typeof formatedData?.allowedSkillIds === "string"
        ? JSON.parse(formatedData?.allowedSkillIds || "[]").map((item: any) =>
            Number(item),
          )
        : formatedData?.allowedSkillIds || [],
    allowedSubAgentIds:
      typeof formatedData?.allowedSubAgentIds === "string"
        ? JSON.parse(formatedData?.allowedSubAgentIds || "[]").map(
            (item: any) => Number(item),
          )
        : formatedData?.allowedSubAgentIds || [],
    profileIds:
      typeof formatedData?.profileIds === "string"
        ? JSON.parse(formatedData?.profileIds || "[]").map((item: any) =>
            Number(item),
          )
        : formatedData?.profileIds || [],
    hasEncryptKey,
  };
};

const formatSchedule = (data: any): ISchedule => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listJob: formatedData?.Jobs || [],
  };
  formatedData = _.omit(formatedData, ["Jobs", "Schedule_Job"]);
  let listJob = formatedData?.listJob;
  listJob = listJob
    ?.map((job: IJob) => _.omit(job, "Schedule_Job"))
    ?.map((job: IJob) => formatJob(job));
  formatedData = {
    ...formatedData,
    listJob,
  };

  const schedule: ISchedule = formatedData;
  return schedule;
};

const formatJob = (data: any): IJob => {
  let formatedData = formatDBResponse(data);
  const hasEncryptKey = Boolean(formatedData?.encryptKey);
  formatedData = _.omit(formatedData, ["encryptKey"]);
  formatedData = {
    ...formatedData,
    schedule:
      formatedData?.Schedules && formatedData?.Schedules?.length > 0
        ? formatSchedule(formatedData?.Schedules[0])
        : null,
    hasEncryptKey,
  };

  formatedData = {
    ...formatedData,
    scheduleId: formatedData?.schedule?.id || 0,
  };
  formatedData = _.omit(formatedData, ["Schedules"]);
  const job: IJob = formatedData;
  return job;
};

const formatAgentTask = (raw: any): IAgentTask => {
  return {
    ...raw,
    metadata: raw.metadata ? JSON.parse(raw.metadata) : {},
    result: raw.result ? JSON.parse(raw.result) : null,
    assignedAgent: raw.assignedAgent
      ? formatAgentProfile(raw.assignedAgent)
      : undefined,
    creatorAgent: raw.creatorAgent
      ? formatAgentProfile(raw.creatorAgent)
      : undefined,
  };
};

const formatAgentMailbox = (raw: any): IAgentMailbox => {
  const formatedData = formatDBResponse(raw);
  return {
    ...formatedData,
    fromAgent: formatedData?.fromAgent
      ? formatAgentProfile(formatedData?.fromAgent)
      : undefined,
  };
};

const formatSetting = (raw: any): ISetting => {
  const formatedData = formatDBResponse(raw) as ISetting;

  try {
    const parsed = JSON.parse(formatedData.data || "{}");
    if (formatedData.type === SETTING_TYPE.AGENT_PRESET) {
      formatedData.agentSetting = {
        chainKey: parsed.chainKey || "",
        nodeEndpointGroupId: parsed.nodeEndpointGroupId || null,
        campaignId: parsed.campaignId || null,
        selectedProfileIds: JSON.parse(parsed.selectedProfileIds || "[]"),
        isAllWallet: parsed.isAllWallet !== false,
      };
    } else if (formatedData.type === SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE) {
      formatedData.workflowGlobalVariable = {
        variable: formatedData.name,
        label: parsed.label || "",
        value: parsed.value || "",
      };
    } else if (formatedData.type === SETTING_TYPE.GENERAL_SETTING) {
      const generalSetting: IGeneralSetting = {
        nodeBlackList:
          typeof parsed.nodeBlackList === "string"
            ? JSON.parse(parsed.nodeBlackList || "[]")
            : parsed.nodeBlackList || [],
        hideMinimap: parsed.hideMinimap,
        deviceId: parsed.deviceId,
        isStopAllSchedule: parsed.isStopAllSchedule,
        dayResetJobStatus: parsed.dayResetJobStatus,
        maxLogAge: parsed.maxLogAge,
        maxHistoryLogAge: parsed.maxHistoryLogAge,
        customChromePath: parsed.customChromePath,
        maxConcurrentJob: parsed.maxConcurrentJob,
        isScreenCaptureProtectionOn: parsed.isScreenCaptureProtectionOn,
      };
      formatedData.generalSetting = generalSetting;
    } else if (formatedData.type === SETTING_TYPE.LLM_SETTING) {
      const llmSetting: ILlmSetting = {
        openAIApiKey: parsed.openAIApiKey
          ? encryptionService.decryptData(parsed.openAIApiKey)
          : "",
        anthropicApiKey: parsed.anthropicApiKey
          ? encryptionService.decryptData(parsed.anthropicApiKey)
          : "",
        googleGeminiApiKey: parsed.googleGeminiApiKey
          ? encryptionService.decryptData(parsed.googleGeminiApiKey)
          : "",
        tavilyApiKey: parsed.tavilyApiKey
          ? encryptionService.decryptData(parsed.tavilyApiKey)
          : "",
        exaApiKey: parsed.exaApiKey
          ? encryptionService.decryptData(parsed.exaApiKey)
          : "",
        openAIModel: parsed.openAIModel,
        anthropicModel: parsed.anthropicModel,
        googleGeminiModel: parsed.googleGeminiModel,
        openAIBackgroundModel: parsed.openAIBackgroundModel,
        anthropicBackgroundModel: parsed.anthropicBackgroundModel,
        googleGeminiBackgroundModel: parsed.googleGeminiBackgroundModel,
        llmProvider: parsed.llmProvider,
        disabledTools:
          typeof parsed.disabledTools === "string"
            ? JSON.parse(parsed.disabledTools || "[]")
            : parsed.disabledTools || [],
        isMcpServerOn: parsed.isMcpServerOn,
        mcpServerPort: parsed.mcpServerPort,
      };
      formatedData.llmSetting = llmSetting;
    } else if (formatedData.type === SETTING_TYPE.DEX_SETTING) {
      const dexSetting: IDexSetting = {
        jupiterApiKeys: parsed.jupiterApiKeys
          ? JSON.parse(
              encryptionService.decryptData(parsed.jupiterApiKeys) || "[]",
            )
          : [],
      };
      formatedData.dexSetting = dexSetting;
    } else if (formatedData.type === SETTING_TYPE.TELEGRAM_SETTING) {
      const telegramSetting: ITelegramSetting = {
        chatIdTelegram: parsed.chatIdTelegram,
        isTelegramOn: parsed.isTelegramOn,
        botTokenTelegram: parsed.botTokenTelegram
          ? encryptionService.decryptData(parsed.botTokenTelegram)
          : "",
      };
      formatedData.telegramSetting = telegramSetting;
    } else if (formatedData.type === SETTING_TYPE.WHATSAPP_SETTING) {
      const whatsappSetting: IWhatsAppSetting = {
        isWhatsAppOn: parsed.isWhatsAppOn,
        whatsappAuthState: parsed.whatsappAuthState,
      };
      formatedData.whatsappSetting = whatsappSetting;
    } else if (formatedData.type === SETTING_TYPE.MASTER_PASSWORD_SETTING) {
      const masterPasswordSetting: IMasterPasswordSetting = {
        masterPasswordVerifier: parsed.masterPasswordVerifier,
      };
      formatedData.masterPasswordSetting = masterPasswordSetting;
    } else if (formatedData.type === SETTING_TYPE.MCP_TOKEN) {
      formatedData.mcpTokenSetting = {
        tokenHash: parsed.tokenHash || "",
        permission: parsed.permission || McpTokenPermission.READ,
      };
    }
  } catch {}
  return formatedData;
};

export {
  formatDBResponse,
  formatResourceGroup,
  formatProfileGroup,
  formatCampaign,
  formatCampaignProfile,
  formatProfile,
  formatMcpServer,
  formatAgentProfile,
  formatWorkflow,
  formatSchedule,
  formatJob,
  formatAgentMailbox,
  formatAgentTask,
  formatSetting,
};
