/**
 * Shared IPC payload types for electron/controller handlers.
 */

import type {
  IAgentSetting,
  IAgentSkill,
  ICampaign,
  ICampaignProfile,
  ICheckTokenPriceNodeConfig,
  IEVMSnipeContractNodeConfig,
  IFlowProfile,
  ILog,
  IMcpServer,
  INodeEndpoint,
  INodeEndpointGroup,
  IPreference,
  IProfile,
  IProfileGroup,
  IProxy,
  IProxyIp,
  IProxyIpGroup,
  IResource,
  IResourceGroup,
  ISchedule,
  IWorkflow,
  IWorkflowVariable,
  ISorter,
  IWallet,
  IWalletGroup,
  LLMProvider,
} from "./type";

// Shared primitives
export type IpcPagePayload = {
  page: number;
  pageSize: number;
  searchText?: string;
};

export type IpcSortedPagePayload = IpcPagePayload & {
  sortField?: ISorter;
};

export type IpcIdPayload = {
  id: number;
};

export type IpcDeletePayload = {
  data: number[];
};

export type IpcExportFilePayload = {
  folderPath: string;
  fileName: string;
};

// Wallet
export type IpcGetListWalletPayload = IpcSortedPagePayload & {
  groupId?: number;
  encryptKey?: string;
};

export type IpcCreateWalletPayload = {
  data: IWallet;
  encryptKey: string;
};

export type IpcUpdateWalletPayload = {
  data: IWallet;
  encryptKey?: string;
};

export type IpcImportWalletPayload = {
  groupId: number;
  listFilePath: string[];
  encryptKey?: string;
};

export type IpcExportWalletPayload = IpcExportFilePayload & {
  groupId: number;
  listWalletId: number[];
  encryptKey?: string;
};

export type IpcGenerateRandomWalletPayload = {
  total: number;
  groupId: number;
  encryptKey?: string;
  chainType?: string;
};

export type IpcGenerateWalletFromPhrasePayload = {
  total: number;
  groupId: number;
  phrase: string;
  encryptKey?: string;
  chainType?: string;
};

// WalletGroup
export type IpcGetListWalletGroupPayload = IpcSortedPagePayload;
export type IpcCreateWalletGroupPayload = {
  data: IWalletGroup;
  isQuickMapCampaign: boolean;
};
export type IpcUpdateWalletGroupPayload = {
  data: IWalletGroup;
};
export type IpcGetWalletGroupDependencyPayload = {
  listWalletGroupId: number[];
};

// Workflow
export type IpcGetListWorkflowPayload = IpcSortedPagePayload;
export type IpcCreateWorkflowPayload = {
  requestId?: string;
  data: IWorkflow;
};
export type IpcUpdateWorkflowPayload = {
  requestId?: string;
  data: IWorkflow;
};

export type IpcExportWorkflowPayload = IpcExportFilePayload & {
  listWorkflowId?: number[];
};

export type IpcImportWorkflowPayload = {
  listFilePath: string[];
};

// Campaign
export type IpcGetListCampaignPayload = IpcSortedPagePayload;
export type IpcCreateCampaignPayload = {
  data: ICampaign;
};
export type IpcUpdateCampaignPayload = {
  data: ICampaign;
};

export type IpcExportCampaignProfilePayload = IpcExportFilePayload & {
  campaignId: number;
  encryptKey?: string;
};

export type IpcExportCampaignPayload = IpcExportFilePayload & {
  campaignId: number;
};

export type IpcImportCampaignPayload = {
  campaignId: number;
  filePath: string;
};

// CampaignProfile
export type IpcGetListCampaignProfilePayload = IpcSortedPagePayload & {
  campaignId: number;
  encryptKey?: string;
  isRunning?: boolean;
};

export type IpcUpdateCampaignProfilePayload = {
  data: ICampaignProfile;
  requestId: string;
  encryptKey?: string;
};

export type IpcUpdateListCampaignProfilePayload = {
  listID: number[];
  profile: ICampaignProfile;
  resetAll: boolean;
  campaignId: number;
};

export type IpcOpenCampaignProfilePayload = {
  flowProfile: IFlowProfile;
};
export type IpcCloseCampaignProfilePayload = {
  flowProfile: IFlowProfile;
};

export type IpcGetCampaignProfileStatusPayload = {
  campaignId?: number;
  workflowId?: number;
};

export type IpcGetCampaignProfileCalculatedValuePayload = {
  campaignId: number;
  listColumn?: string[];
  useProvidedColumn?: boolean;
};

export type IpcGetCampaignProfileColumnStatsPayload = {
  campaignId: number;
};

// Profile
export type IpcGetListProfilePayload = IpcPagePayload & {
  groupId?: number;
  encryptKey?: string;
};

export type IpcCreateProfilePayload = {
  numberOfProfile: number;
  walletGroupId?: number;
  listResourceGroupId: number[];
  groupId: number;
};

export type IpcUpdateProfilePayload = {
  data: IProfile;
};

export type IpcExportProfilePayload = IpcExportFilePayload & {
  groupId: number;
  encryptKey?: string;
};

// ProfileGroup
export type IpcGetListProfileGroupPayload = IpcSortedPagePayload;
export type IpcCreateProfileGroupPayload = {
  data: IProfileGroup;
};
export type IpcUpdateProfileGroupPayload = {
  data: IProfileGroup;
};

// Resource
export type IpcGetListResourcePayload = IpcPagePayload & {
  groupId?: number;
  encryptKey?: string;
};

export type IpcCreateResourcePayload = {
  data: IResource;
  encryptKey?: string;
};
export type IpcUpdateResourcePayload = {
  data: IResource;
  encryptKey?: string;
};

export type IpcImportResourcePayload = {
  groupId: number;
  listFilePath: string[];
  encryptKey?: string;
};

export type IpcExportResourcePayload = IpcExportFilePayload & {
  groupId: number;
  encryptKey?: string;
};

// ResourceGroup
export type IpcGetListResourceGroupPayload = IpcSortedPagePayload;
export type IpcCreateResourceGroupPayload = {
  data: IResourceGroup;
};
export type IpcUpdateResourceGroupPayload = {
  data: IResourceGroup;
};

export type IpcExportResourceGroupPayload = IpcExportFilePayload & {
  resourceGroupId: number;
};

export type IpcImportResourceGroupPayload = {
  resourceGroupId: number;
  filePath: string;
};

// Proxy
export type IpcGetListProxyPayload = IpcPagePayload & {
  type?: string;
};
export type IpcCreateProxyPayload = {
  data: IProxy;
};
export type IpcUpdateProxyPayload = {
  data: IProxy;
};

// ProxyIp
export type IpcGetListProxyIpPayload = IpcPagePayload & {
  groupId?: number;
};
export type IpcCreateProxyIpPayload = {
  data: IProxyIp[];
};
export type IpcUpdateProxyIpPayload = {
  data: IProxyIp;
};

// ProxyIpGroup
export type IpcGetListProxyIpGroupPayload = IpcPagePayload;
export type IpcCreateProxyIpGroupPayload = {
  data: IProxyIpGroup;
};
export type IpcUpdateProxyIpGroupPayload = {
  data: IProxyIpGroup;
};

// NodeEndpoint
export type IpcGetListNodeEndpointPayload = IpcPagePayload & {
  groupId?: number;
};
export type IpcCreateNodeEndpointPayload = {
  data: INodeEndpoint[];
};
export type IpcUpdateNodeEndpointPayload = {
  data: INodeEndpoint;
};

// NodeEndpointGroup
export type IpcGetListNodeEndpointGroupPayload = IpcPagePayload;
export type IpcCreateNodeEndpointGroupPayload = {
  data: INodeEndpointGroup;
};
export type IpcUpdateNodeEndpointGroupPayload = {
  data: INodeEndpointGroup;
};

// Schedule
export type IpcGetListSchedulePayload = IpcPagePayload & {
  sortBy?: ISorter;
  scheduleId?: number;
};

export type IpcGetOneSchedulePayload = {
  scheduleId: number;
};
export type IpcCreateSchedulePayload = {
  data: ISchedule;
};
export type IpcUpdateSchedulePayload = {
  data: ISchedule;
};

// ScheduleLog
export type IpcGetListScheduleLogPayload = IpcSortedPagePayload & {
  scheduleId?: number;
};

// Job
export type IpcMarkJobCompletedPayload = {
  jobId: number;
};

export type IpcCheckJobExistedPayload = {
  campaignId?: number;
  workflowId?: number;
};

// UserLog
export type IpcGetListUserLogPayload = IpcPagePayload & {
  campaignId?: number;
  workflowId?: number;
};

export type IpcCreateUserLogPayload = {
  data: ILog;
};

// Extension
export type IpcGetListExtensionPayload = {
  searchText?: string;
};
export type IpcGetListExtensionByNamePayload = {
  listExtensionName: string[];
};
export type IpcImportExtensionPayload = {
  listFile: any[];
};
export type IpcGetExtensionIdOnBrowserPayload = {
  extensionPath: string;
  id: number;
};

// McpServer
export type IpcGetListMcpServerPayload = IpcSortedPagePayload & {
  groupId?: number;
};

export type IpcCreateMcpServerPayload = {
  data: IMcpServer;
};
export type IpcUpdateMcpServerPayload = {
  data: IMcpServer;
};

export type IpcGetMcpServerToolsPayload = {
  serverId: number;
  serverName: string;
  config: string;
};

// Preference
export type IpcUpdatePreferencePayload = {
  requestId?: string;
  data: IPreference;
  isUpdateAgentTool?: boolean;
};

// NodeSecret
export type IpcUpsertNodeSecretPayload = {
  requestId?: string;
  workflowId: number;
  nodeId: string;
  secretKey?: string;
};

export type IpcGetNodeSecretPayload = {
  requestId?: string;
  workflowId: number;
  nodeId: string;
};

// MasterPassword
export type IpcSetupMasterPasswordPayload = {
  password: string;
  email: string;
};
export type IpcVerifyMasterPasswordPayload = {
  password: string;
  email: string;
};
export type IpcResetMasterPasswordPayload = {
  newPassword?: string;
  email: string;
};

// Workflow
export type IpcTerminateThreadPayload = {
  threadID: string;
  requestId?: string;
  campaignId?: number;
  workflowId?: number;
};

export type IpcStartWorkflowPayload = {
  workflowId: number;
  campaignId?: number;
  encryptKey?: string;
  overrideListVariable?: IWorkflowVariable[];
};

export type IpcStopWorkflowPayload = {
  workflowId: number;
  campaignId?: number;
};
export type IpcSyncWorkflowPayload = {
  workflowId: number;
  campaignId?: number;
};

export type IpcGetSampleContractSniperResultPayload = {
  config: IEVMSnipeContractNodeConfig;
  sampleSize?: number;
  campaignId?: number;
  workflowId?: number;
};

export type IpcGetPriceCheckingDataPayload = {
  config: ICheckTokenPriceNodeConfig;
};
export type IpcGetMarketcapCheckingDataPayload = {
  config: ICheckTokenPriceNodeConfig;
};
export type IpcRunJavascriptCodePayload = {
  code: string;
  listVariable?: any[];
};

// AgentSkill
export type IpcGetListAgentSkillPayload = IpcSortedPagePayload;
export type IpcCreateAgentSkillPayload = {
  data: IAgentSkill;
};
export type IpcUpdateAgentSkillPayload = {
  data: IAgentSkill;
};

// AgentSetting
export type IpcGetListAgentSettingPayload = IpcSortedPagePayload & {
  type?: string;
};
export type IpcCreateAgentSettingPayload = {
  data: IAgentSetting;
};
export type IpcUpdateAgentSettingPayload = {
  data: IAgentSetting;
};

// AppAgent
export type IpcAgentCreateSessionPayload = {
  provider?: LLMProvider;
};
export type IpcAgentRunPayload = {
  sessionId: string;
  input: string;
};
export type IpcAgentStopPayload = {
  sessionId?: string;
};
export type IpcAgentResetSessionPayload = {
  sessionId: string;
};
export type IpcAgentChangeProviderPayload = {
  sessionId: string;
  provider: LLMProvider;
};
export type IpcAgentGetStatusPayload = {
  sessionId?: string;
};
export type IpcAgentDestroySessionPayload = {
  sessionId: string;
};

// Browser
export type IpcDownloadBrowserPayload = {
  revision: string;
};

// Database
export type IpcExportDatabasePayload = {
  folderPath: string;
};
export type IpcImportDatabasePayload = {
  filePath: string;
};

// Dialog
export type IpcChooseFilePayload = {
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
};

export type IpcReadFileAsDataUrlPayload = {
  path: string;
};

export type IpcSaveClipboardImagePayload = {
  base64: string;
  mimeType: string;
};

export type IpcDeleteTempFilePayload = {
  path: string;
};

export type IpcOpenFolderPayload = {
  folderPath?: string;
  skillFolderName?: string;
  isOpenFile?: boolean;
};

// File
export type IpcFolderStatisticPayload = {
  limit: number;
};

// Window
export type IpcOpenExternalLinkPayload = {
  url: string;
};

// Search
export type IpcGlobalSearchPayload = {
  searchText: string;
};

// SecretKeyCache
export type IpcGetSecretKeyCachePayload = {
  campaignId: number;
};
export type IpcSetSecretKeyCachePayload = {
  campaignId: number;
  value: any;
};

// ChatHistory
export type IpcChatHistorySaveMessagePayload = {
  role?: string;
  content?: string;
  timestamp?: number;
};

export type IpcChatHistoryLoadPayload = {
  limit?: number;
};
