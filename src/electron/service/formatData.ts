import { Model } from "sequelize";
import _ from "lodash";
import {
  ICampaign,
  ICampaignProfile,
  ILog,
  IPreference,
  IProfile,
  IProfileGroup,
  IResource,
  IResourceGroup,
  ISchedule,
  IJob,
  IWorkflow,
  IScheduleLog,
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

const formatCampaign = (data: Model<any, any>): ICampaign => {
  let formatedData = formatDBResponse(data);

  formatedData = {
    ...formatedData,
    listWorkflow: formatedData?.Workflows || [],
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
    proxyIpGroup: formatDBResponse(formatedData?.proxyIpGroup),
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
  return {
    ...data,
    nodeBlackList:
      typeof data?.nodeBlackList === "string"
        ? JSON.parse(data?.nodeBlackList || "[]")
        : data?.nodeBlackList,
    botTokenTelegram: data?.botTokenTelegram
      ? encryptionService.decryptData(data?.botTokenTelegram)
      : "",
    jupiterApiKeys:
      typeof data?.jupiterApiKeys === "string"
        ? JSON.parse(
            encryptionService.decryptData(data?.jupiterApiKeys) || "[]",
          )
        : data?.jupiterApiKeys,
    openAIApiKey: data?.openAIApiKey
      ? encryptionService.decryptData(data?.openAIApiKey)
      : "",
    anthropicApiKey: data?.anthropicApiKey
      ? encryptionService.decryptData(data?.anthropicApiKey)
      : "",
    googleGeminiApiKey: data?.googleGeminiApiKey
      ? encryptionService.decryptData(data?.googleGeminiApiKey)
      : "",
    disabledTools:
      typeof data?.disabledTools === "string"
        ? JSON.parse(data?.disabledTools || "[]")
        : data?.disabledTools,
  };
};

const formatLog = (data: Model<any, any>): ILog => {
  const formatedData: ILog = formatDBResponse(data);
  return formatedData;
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
  formatedData = {
    ...formatedData,
    schedule:
      formatedData?.Schedules && formatedData?.Schedules?.length > 0
        ? formatSchedule(formatedData?.Schedules[0])
        : null,
    secretKey: formatedData?.secretKey
      ? encryptionService.decryptData(formatedData?.secretKey)
      : "",
  };

  formatedData = {
    ...formatedData,
    scheduleId: formatedData?.schedule?.id || 0,
  };
  formatedData = _.omit(formatedData, ["Schedules"]);
  const job: IJob = formatedData;
  return job;
};

const formatScheduleLog = (data: any): IScheduleLog => {
  const scheduleLog: IScheduleLog = formatDBResponse(data);
  return scheduleLog;
};

export {
  formatProfileGroup,
  formatCampaign,
  formatCampaignProfile,
  formatProfile,
  formatPreference,
  formatWorkflow,
  formatLog,
  formatSchedule,
  formatJob,
  formatScheduleLog,
};
