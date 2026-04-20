import type {
  IAgentProfile,
  ISetting,
  IAgentSkill,
  IAgentTask,
  ICampaign,
  ICampaignProfile,
  ICheckTokenPriceNodeConfig,
  IEVMSnipeContractNodeConfig,
  IFlowProfile,
  IMcpServer,
  IMcpToken,
  INodeEndpoint,
  INodeEndpointGroup,
  IPreference,
  IProfile,
  IProfileGroup,
  IStaticProxy,
  IStaticProxyGroup,
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

// StaticProxy
export type IpcGetListStaticProxyPayload = IpcPagePayload & {
  groupId?: number;
};
export type IpcCreateStaticProxyPayload = {
  data: IStaticProxy[];
};
export type IpcUpdateStaticProxyPayload = {
  data: IStaticProxy;
};

// StaticProxyGroup
export type IpcGetListStaticProxyGroupPayload = IpcPagePayload;
export type IpcCreateStaticProxyGroupPayload = {
  data: IStaticProxyGroup;
};
export type IpcUpdateStaticProxyGroupPayload = {
  data: IStaticProxyGroup;
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

// Job
export type IpcUpdateJobPayload = {
  id: number;
  llmProvider?: string;
  prompt?: string;
  agentProfileId?: number | null;
  handoffToNext?: boolean;
};

export type IpcMarkJobCompletedPayload = {
  jobId: number;
};

export type IpcCheckJobExistedPayload = {
  campaignId?: number;
  workflowId?: number;
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
  encryptKey?: string;
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

// Setting
export type IpcGetListSettingPayload = IpcSortedPagePayload & {
  type?: string;
};
export type IpcCreateSettingPayload = {
  data: ISetting;
};
export type IpcUpdateSettingPayload = {
  data: ISetting;
};

// Agent profile
export type IpcGetListAgentProfilePayload = IpcPagePayload;
export type IpcGetOneAgentProfilePayload = {
  id: number;
};
export type IpcCreateAgentProfilePayload = {
  data: Partial<IAgentProfile>;
};
export type IpcUpdateAgentProfilePayload = {
  data: IAgentProfile;
};
export type IpcGetAgentProfileMemoryPayload = {
  agentProfileId: number;
};
export type IpcSaveAgentProfileMemoryPayload = {
  agentProfileId: number;
  content: string;
};
export type IpcGetListAgentProfileLogPayload = IpcPagePayload & {
  agentProfileId: number;
};
export type IpcAgentProfileCreateSessionPayload = {
  agentProfileId: number;
};
export type IpcAgentProfileRunPayload = {
  sessionId: string;
  input: string;
  encryptKey?: string;
};
export type IpcAgentProfileStopPayload = {
  sessionId: string;
};
export type IpcAgentProfileResetSessionPayload = {
  sessionId: string;
};

// AgentTask
export type IpcGetListAgentTaskPayload = Record<string, never>;
export type IpcGetOneAgentTaskPayload = {
  id: number;
};
export type IpcCreateAgentTaskPayload = {
  data: Partial<IAgentTask>;
};
export type IpcUpdateAgentTaskPayload = {
  id: number;
  data: Partial<IAgentTask>;
};
export type IpcGetAgentAnalyticsPayload = {
  fromTimestamp: number;
};

// AgentCore
export type IpcAgentCreateSessionPayload = {
  provider?: LLMProvider;
};
export type IpcAgentRunPayload = {
  sessionId: string;
  input: string;
  encryptKey?: string;
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
  requestId?: string;
};

export type IpcSaveClipboardImagePayload = {
  base64: string;
  mimeType: string;
  requestId?: string;
};

export type IpcDeleteTempFilePayload = {
  path: string;
};

export type IpcOpenFolderPayload = {
  folderPath?: string;
  skillFolderName?: string;
  isOpenFile?: boolean;
};

export type IpcCheckModelCapabilityPayload = {
  modelName: string;
  provider: LLMProvider;
  requestId?: string;
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

// EncryptKeyCache
export type IpcGetEncryptKeyCachePayload = {
  campaignId: number;
};
export type IpcSetEncryptKeyCachePayload = {
  campaignId: number;
  value: any;
};

// ChatHistory
export type IpcChatHistorySaveMessagePayload = {
  role?: string;
  content?: string;
  timestamp?: number;
  sessionId?: string | null;
  runId?: string | null;
};

export type IpcChatHistoryLoadPayload = {
  limit?: number;
};

// Keeper MCP Token
export type IpcCreateMcpTokenPayload = {
  data: IMcpToken & { plainToken: string };
};

export type IpcDeleteMcpTokenPayload = {
  data: number[];
};
