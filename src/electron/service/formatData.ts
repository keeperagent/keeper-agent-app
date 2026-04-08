import { Model } from "sequelize";
import _ from "lodash";
import {
  ICampaign,
  ICampaignProfile,
  IMcpServer,
  IAgentProfile,
  IAgentMailbox,
  IPreference,
  IProfile,
  IProfileGroup,
  IResource,
  IResourceGroup,
  ISchedule,
  IJob,
  IWorkflow,
  IAgentTask,
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

const formatPreference = (data: any): IPreference => {
  const formatedData = formatDBResponse(data);
  return {
    ...formatedData,
    nodeBlackList:
      typeof formatedData?.nodeBlackList === "string"
        ? JSON.parse(formatedData?.nodeBlackList || "[]")
        : formatedData?.nodeBlackList,
    botTokenTelegram: formatedData?.botTokenTelegram
      ? encryptionService.decryptData(formatedData?.botTokenTelegram)
      : "",
    jupiterApiKeys:
      typeof formatedData?.jupiterApiKeys === "string"
        ? JSON.parse(
            encryptionService.decryptData(formatedData?.jupiterApiKeys) || "[]",
          )
        : formatedData?.jupiterApiKeys,
    openAIApiKey: formatedData?.openAIApiKey
      ? encryptionService.decryptData(formatedData?.openAIApiKey)
      : "",
    anthropicApiKey: formatedData?.anthropicApiKey
      ? encryptionService.decryptData(formatedData?.anthropicApiKey)
      : "",
    googleGeminiApiKey: formatedData?.googleGeminiApiKey
      ? encryptionService.decryptData(formatedData?.googleGeminiApiKey)
      : "",
    tavilyApiKey: formatedData?.tavilyApiKey
      ? encryptionService.decryptData(formatedData?.tavilyApiKey)
      : "",
    exaApiKey: formatedData?.exaApiKey
      ? encryptionService.decryptData(formatedData?.exaApiKey)
      : "",
    disabledTools:
      typeof formatedData?.disabledTools === "string"
        ? JSON.parse(formatedData?.disabledTools || "[]")
        : formatedData?.disabledTools,
  };
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

export {
  formatDBResponse,
  formatResourceGroup,
  formatProfileGroup,
  formatCampaign,
  formatCampaignProfile,
  formatProfile,
  formatPreference,
  formatMcpServer,
  formatAgentProfile,
  formatWorkflow,
  formatSchedule,
  formatJob,
  formatAgentMailbox,
  formatAgentTask,
};
