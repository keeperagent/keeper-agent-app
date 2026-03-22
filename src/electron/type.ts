import { ethers } from "ethers";
import {
  CAPTCHA_TYPE,
  CHAIN_TYPE,
  COMPARISION_EXPRESSION,
  CONTRACT_SNIPER_MODE,
  ENCRYPT_MODE,
  EVM_TRANSACTION_TYPE,
  FOLLOW_TWITTER_ACTION,
  HTTP_METHOD,
  IMPORT_WALLET_TYPE,
  KYBERSWAP_CHAIN_KEY,
  LIKE_TWITTER_ACTION,
  LOG_TYPE,
  MATH_EQUATION,
  METAMASK_GAS_MODE,
  NODE_STATUS,
  POOL_TYPE,
  PRICE_DATA_SOURCE,
  PROFILE_STATUS,
  RANDOM_OPTION,
  RETEET_TWITTER_ACTION,
  WORKFLOW_TYPE,
  SCROLL_DIRECTION,
  SCROLL_TYPE,
  SELECTOR_TYPE,
  SET_ATTRIBUTE_MODE,
  TELEGRAM_SNIPER_MODE,
  TOKEN_TYPE,
  WINDOW_TYPE,
} from "./constant";
import { NODE_ACTION } from "./simulator/constant";

export enum ScheduleType {
  WORKFLOW = "workflow",
  AGENT = "agent",
}

export enum JobType {
  WORKFLOW = "workflow",
  AGENT = "agent",
}

export enum JobConditionType {
  NONE = "none",
  SKIP_IF_PREV_FAILED = "skip_if_prev_failed",
  LLM = "llm",
}

export enum AgentScheduleStatus {
  RUNNING = "running",
  SUCCESS = "success",
  ERROR = "error",
  SKIPPED = "skipped",
  RETRYING = "retrying",
}

export enum LLMProvider {
  OPENAI = "openai",
  CLAUDE = "claude",
  GEMINI = "gemini",
}

// api response
export type IGetListResponse<T> = {
  data: T[];
  totalData: number;
  page: number;
  pageSize: number;
  totalPage: number;
};

// wallet
export type IWallet = {
  id?: number;
  index?: number;
  groupId?: number;
  address?: string;
  phrase?: string;
  privateKey?: string;
  note?: string;
  group?: IWalletGroup;
  isEncrypted?: boolean;
  isOriginalEncrypted?: boolean;
  createAt?: number;
  updateAt?: number;
  typeName?: string; // type of blockchain
  color?: string;
};

export type IWalletGroup = {
  id?: number;
  name?: string;
  note?: string;
  createAt?: number;
  updateAt?: number;
  totalWallet?: number;
  typeName?: string;
  portfolioApp?: string;
  listProfileGroup?: IProfileGroup[];
};

export type IProfile = {
  id?: number;
  name?: string;
  note?: string;
  groupId?: number;
  createAt?: number;
  updateAt?: number;
  walletId?: number;
  walletGroupId?: number;
  listResourceId?: number[];
  wallet?: IWallet;
  listResource?: IResource[];
  group?: IProfileGroup;
};

export type IProxy = {
  id?: number;
  apiKey?: string;
  description?: string;
  type?: string; // name of proxy third party service
  isApiKeyAlive?: boolean;
  createAt?: number;
  updateAt?: number;
};

export type ILog = {
  id?: number;
  content?: string;
  workflowId?: number;
  workflow?: IWorkflow;
  campaignId?: number;
  campaign?: ICampaign;
  createAt?: number;
  updateAt?: number;
};

// Structured log payload for logEveryWhere: message + optional context (campaign, workflow, thread, type)
export type IStructuredLogPayload = {
  message?: string;
  type?: LOG_TYPE;
  campaignId?: number;
  workflowId?: number;
  campaignName?: string;
  workflowName?: string;
  threadId?: string | number;
};

export type IWorkflow = {
  id?: number;
  name?: string;
  note?: string;
  data?: string;
  numberOfThread?: number;
  numberOfRound?: number;
  windowWidth?: number;
  windowHeight?: number;
  isFullScreen?: boolean;
  color?: string;
  listCampaign?: ICampaign[];
  lastRunTime?: number;
  lastEndTime?: number;
  createAt?: number;
  updateAt?: number;
  listVariable?: IWorkflowVariable[];
};

// resource
export type IResourceGroup = {
  id?: number;
  name?: string;
  note?: string;
  createAt?: number;
  updateAt?: number;
  col1Variable?: string;
  col2Variable?: string;
  col3Variable?: string;
  col4Variable?: string;
  col5Variable?: string;
  col6Variable?: string;
  col7Variable?: string;
  col8Variable?: string;
  col9Variable?: string;
  col10Variable?: string;
  col11Variable?: string;
  col12Variable?: string;
  col13Variable?: string;
  col14Variable?: string;
  col15Variable?: string;
  col16Variable?: string;
  col17Variable?: string;
  col18Variable?: string;
  col19Variable?: string;
  col20Variable?: string;
  col21Variable?: string;
  col22Variable?: string;
  col23Variable?: string;
  col24Variable?: string;
  col25Variable?: string;
  col26Variable?: string;
  col27Variable?: string;
  col28Variable?: string;
  col29Variable?: string;
  col30Variable?: string;
  col1Label?: string;
  col2Label?: string;
  col3Label?: string;
  col4Label?: string;
  col5Label?: string;
  col6Label?: string;
  col7Label?: string;
  col8Label?: string;
  col9Label?: string;
  col10Label?: string;
  col11Label?: string;
  col12Label?: string;
  col13Label?: string;
  col14Label?: string;
  col15Label?: string;
  col16Label?: string;
  col17Label?: string;
  col18Label?: string;
  col19Label?: string;
  col20Label?: string;
  col21Label?: string;
  col22Label?: string;
  col23Label?: string;
  col24Label?: string;
  col25Label?: string;
  col26Label?: string;
  col27Label?: string;
  col28Label?: string;
  col29Label?: string;
  col30Label?: string;
  totalResource?: number;
  col1IsEncrypt?: false;
  col2IsEncrypt?: false;
  col3IsEncrypt?: false;
  col4IsEncrypt?: false;
  col5IsEncrypt?: false;
  col6IsEncrypt?: false;
  col7IsEncrypt?: false;
  col8IsEncrypt?: false;
  col9IsEncrypt?: false;
  col10IsEncrypt?: false;
  col11IsEncrypt?: false;
  col12IsEncrypt?: false;
  col13IsEncrypt?: false;
  col14IsEncrypt?: false;
  col15IsEncrypt?: false;
  col16IsEncrypt?: false;
  col17IsEncrypt?: false;
  col18IsEncrypt?: false;
  col19IsEncrypt?: false;
  col20IsEncrypt?: false;
  col21IsEncrypt?: false;
  col22IsEncrypt?: false;
  col23IsEncrypt?: false;
  col24IsEncrypt?: false;
  col25IsEncrypt?: false;
  col26IsEncrypt?: false;
  col27IsEncrypt?: false;
  col28IsEncrypt?: false;
  col29IsEncrypt?: false;
  col30IsEncrypt?: false;
  typeName?: string;
  listProfileGroup?: IProfileGroup[];
};

export type IResource = {
  id?: number;
  groupId?: number;
  group?: IResourceGroup;
  col1?: string;
  col2?: string;
  col3?: string;
  col4?: string;
  col5?: string;
  col6?: string;
  col7?: string;
  col8?: string;
  col9?: string;
  col10?: string;
  col11?: string;
  col12?: string;
  col13?: string;
  col14?: string;
  col15?: string;
  col16?: string;
  col17?: string;
  col18?: string;
  col19?: string;
  col20?: string;
  col21?: string;
  col22?: string;
  col23?: string;
  col24?: string;
  col25?: string;
  col26?: string;
  col27?: string;
  col28?: string;
  col29?: string;
  col30?: string;
  col1IsEncrypt?: false;
  col2IsEncrypt?: false;
  col3IsEncrypt?: false;
  col4IsEncrypt?: false;
  col5IsEncrypt?: false;
  col6IsEncrypt?: false;
  col7IsEncrypt?: false;
  col8IsEncrypt?: false;
  col9IsEncrypt?: false;
  col10IsEncrypt?: false;
  col11IsEncrypt?: false;
  col12IsEncrypt?: false;
  col13IsEncrypt?: false;
  col14IsEncrypt?: false;
  col15IsEncrypt?: false;
  col16IsEncrypt?: false;
  col17IsEncrypt?: false;
  col18IsEncrypt?: false;
  col19IsEncrypt?: false;
  col20IsEncrypt?: false;
  col21IsEncrypt?: false;
  col22IsEncrypt?: false;
  col23IsEncrypt?: false;
  col24IsEncrypt?: false;
  col25IsEncrypt?: false;
  col26IsEncrypt?: false;
  col27IsEncrypt?: false;
  col28IsEncrypt?: false;
  col29IsEncrypt?: false;
  col30IsEncrypt?: false;
  isEncrypted?: boolean;
  isOriginalEncrypted?: boolean;
  createAt?: number;
  updateAt?: number;
};

// profile
export type IProfileGroup = {
  id?: number;
  name?: string;
  note?: string;
  createAt?: number;
  updateAt?: number;
  walletGroupId?: number;
  listExtensionId?: number[];
  listResourceGroupId?: number[];
  walletGroup?: IWalletGroup;
  listExtension?: IExtension[];
  listResourceGroup?: IResourceGroup[];
  listCampaign?: ICampaign[];
  typeName?: string;
  totalProfile?: number;
};

export type ICampaign = {
  id?: number;
  name?: string;
  note?: string;
  listWorkflowId?: number[];
  profileGroupId?: number;
  listCampaignProfileId?: number[];
  profileType?: string;
  listCampaignProfile?: ICampaignProfile[];
  listWorkflow?: IWorkflow[];
  profileGroup?: IProfileGroup;
  totalProfile?: number;
  numberOfThread?: number;
  numberOfRound?: number;
  sleepBetweenRound?: number;
  isSaveProfile?: boolean;
  isUseProxy?: boolean;
  maxProfilePerProxy?: number;
  proxyType?: string;
  proxyService?: string;
  proxyIpGroupId?: number;
  proxyIpGroup?: IProxyIpGroup;
  reloadDuration?: number;
  defaultOpenUrl?: string;
  isUseRandomUserAgent?: boolean;
  userAgentCategory?: string;
  windowWidth?: number;
  windowHeight?: number;
  isFullScreen?: boolean;
  isUseBrowser?: boolean;
  color?: string;
  col1Variable?: string;
  col2Variable?: string;
  col3Variable?: string;
  col4Variable?: string;
  col5Variable?: string;
  col6Variable?: string;
  col7Variable?: string;
  col8Variable?: string;
  col9Variable?: string;
  col10Variable?: string;
  col11Variable?: string;
  col12Variable?: string;
  col13Variable?: string;
  col14Variable?: string;
  col15Variable?: string;
  col16Variable?: string;
  col17Variable?: string;
  col18Variable?: string;
  col19Variable?: string;
  col20Variable?: string;
  col21Variable?: string;
  col22Variable?: string;
  col23Variable?: string;
  col24Variable?: string;
  col25Variable?: string;
  col26Variable?: string;
  col27Variable?: string;
  col28Variable?: string;
  col29Variable?: string;
  col30Variable?: string;
  col1Label?: string;
  col2Label?: string;
  col3Label?: string;
  col4Label?: string;
  col5Label?: string;
  col6Label?: string;
  col7Label?: string;
  col8Label?: string;
  col9Label?: string;
  col10Label?: string;
  col11Label?: string;
  col12Label?: string;
  col13Label?: string;
  col14Label?: string;
  col15Label?: string;
  col16Label?: string;
  col17Label?: string;
  col18Label?: string;
  col19Label?: string;
  col20Label?: string;
  col21Label?: string;
  col22Label?: string;
  col23Label?: string;
  col24Label?: string;
  col25Label?: string;
  col26Label?: string;
  col27Label?: string;
  col28Label?: string;
  col29Label?: string;
  col30Label?: string;
  sortField?: string;
  sortOrder?: string;
  listColumnForCalculate?: string | string[];
  unitForCalculate?: string;
  createAt?: number;
  updateAt?: number;
};

export type ICampaignProfile = {
  id?: number;
  name?: string;
  note?: string;
  color?: string;
  groupId?: number;
  createAt?: number;
  updateAt?: number;
  walletId?: number;
  walletGroupId?: number;
  walletGroup?: IWalletGroup;
  listResourceId?: number[];
  wallet?: IWallet;
  listResource?: IResource[];
  group?: IProfileGroup;
  campaignId?: number;
  campaign?: ICampaign;
  proxyIp?: IProxyIp;
  proxyIpId?: number;
  round?: number;
  isRunning?: boolean;
  profileFolder?: string; // each profile have its own chrome-profile folder
  profileFolderPath?: string;
  isActive?: boolean;
  col1Value?: string;
  col2Value?: string;
  col3Value?: string;
  col4Value?: string;
  col5Value?: string;
  col6Value?: string;
  col7Value?: string;
  col8Value?: string;
  col9Value?: string;
  col10Value?: string;
  col11Value?: string;
  col12Value?: string;
  col13Value?: string;
  col14Value?: string;
  col15Value?: string;
  col16Value?: string;
  col17Value?: string;
  col18Value?: string;
  col19Value?: string;
  col20Value?: string;
  col21Value?: string;
  col22Value?: string;
  col23Value?: string;
  col24Value?: string;
  col25Value?: string;
  col26Value?: string;
  col27Value?: string;
  col28Value?: string;
  col29Value?: string;
  col30Value?: string;
};

export type IExtension = {
  id?: number;
  extensionId?: string;
  name?: string;
  description?: string;
  storedAtPath?: string;
  iconPath?: string;
  version?: string;
  typeName?: string;
};

export type IWorkflowVariable = {
  variable: string;
  label?: string;
  value?: any;
};

export type IProxyIpGroup = {
  id?: number;
  name?: string;
  note?: string;
  totalProxyIp?: number;
  createAt?: number;
  updateAt?: number;
};

export type IProxyIp = {
  id?: number;
  groupId?: number;
  ip?: string;
  port?: number;
  note?: string;
  protocol?: string; // http, https
  createAt?: number;
  updateAt?: number;
};

export type INodeEndpointGroup = {
  id?: number;
  name?: string;
  note?: string;
  chainType?: string;
  totalNodeEndpoint?: number;
  createAt?: number;
  updateAt?: number;
};

export type INodeEndpoint = {
  id?: number;
  groupId?: number;
  endpoint?: string;
  isActive?: boolean;
  createAt?: number;
  updateAt?: number;
};

// Workflow
export type CampaignConfig = {
  isUseProxy?: boolean;
  maxProfilePerProxy?: number;
  proxyType?: string;
  proxyService?: string;
  isUseRandomUserAgent?: boolean;
  userAgentCategory?: string;
  windowWidth?: number;
  windowHeight?: number;
  isFullScreen?: boolean;
  totalScreen?: number;
  defaultOpenUrl?: string;
  numberOfRound?: number;
  totalProfileInWorkflow?: number;
  workflowId?: number;
  campaignId?: number;
  isUseBrowser?: boolean;
};

// FlowProfile is latest status of a Profile flow through Node, Edge of Workflow
export type IFlowProfile = {
  profile?: ICampaignProfile;
  listVariable?: IWorkflowVariable[];
  isSaveProfile?: boolean;
  nodeID?: string | null;
  edgeID?: string | null;
  threadID: string; // which thread FlowProfile belongs to, user can kill thread by remove flowfile
  nextRunTimestamp?: number; // FlowProfile can wait some amount of time before it run
  config?: INodeConfig;
  startTimestamp?: number;
  endTimestamp?: number | null;
  initialTimestamp?: number;
  lastRunDuration?: number;
  campaignConfig?: CampaignConfig;
  isConditionSuccess?: boolean;
};

export type INodeConfig =
  | IOpenURLNodeConfig
  | IReloadPageNodeConfig
  | IGoBackNodeConfig
  | ICloseTabNodeConfig
  | IGetWalletBalanceNodeConfig
  | IConvertTokenAmountNodeConfig
  | IGetGasPriceNodeConfig
  | IGetPriorityFeeNodeConfig
  | IGenerateVanityAddressNodeConfig
  | IScrollNodeConfig
  | IClickNodeConfig
  | IClickExtensionNodeConfig
  | IUploadFileNodeConfig
  | ITypeTextNodeConfig
  | ISelectTabNodeConfig
  | IImportMetamaskNodeConfig
  | IUnlockMetamaskNodeConfig
  | IConnectMetamaskNodeConfig
  | IApproveMetamaskNodeConfig
  | ICancelMetamaskNodeConfig
  | IConfirmMetamaskNodeConfig
  | ISolveCaptchaNodeConfig
  | ISwitchWindowNodeConfig
  | IOpenNewTabNodeConfig
  | ILoopNodeConfig
  | ISetAttributeNodeConfig
  | ICrawlTextNodeConfig
  | ILoginTwitterNodeConfig
  | ISaveWalletNodeConfig
  | ISaveResourceNodeConfig
  | ICheckConditionNodeConfig
  | IGetRandomValueNodeConfig
  | IImportRabbyWalletNodeConfig
  | IUnlockRabbyWalletNodeConfig
  | IConnectRabbyWalletNodeConfig
  | ICancelRabbyWalletNodeConfig
  | ISignRabbyWalletNodeConfig
  | IRabbyAddNetworkNodeConfig
  | ICheckElementExistNodeConfig
  | ICalculateNodeConfig
  | IUpdateProfileNodeConfig
  | IImportMartianWalletNodeConfig
  | IApproveMartianWalletNodeConfig
  | ISwitchMartianWalletNodeConfig
  | IUnlockMartianWalletNodeConfig
  | ISelectTokenNodeConfig
  | IFollowTwitterNodeConfig
  | ILikeTwitterNodeConfig
  | IReTweetTwitterNodeConfig
  | IReplyTweetTwitterNodeConfig
  | ISendTelegramNodeConfig
  | ISnipeTelegramNodeConfig
  | IImportPhantomWalletNodeConfig
  | IUnlockPhantomWalletNodeConfig
  | IConnectPhantomWalletNodeConfig
  | IExecuteCodeNodeConfig
  | IOnOffProfileNodeConfig
  | IClickConfirmPhantomWalletNodeConfig
  | ITransferTokenNodeConfig
  | IApproveRevokeEVMNodeConfig
  | ISwapUniswapNodeConfig
  | ISwapKyberswapNodeConfig
  | ISwapJupiterNodeConfig
  | ISwapCetusNodeConfig
  | IExecuteTransactionNodeConfig
  | IEVMSnipeContractNodeConfig
  | IGetTokenPriceNodeConfig
  | ISelectWalletNodeConfig
  | ICheckResourceNodeConfig
  | IEVMReadFromContractNodeConfig
  | IEVMWriteContractNodeConfig
  | IHttpRequestNodeConfig
  | ICheckMarketcapNodeConfig
  | ICheckTokenPriceNodeConfig
  | IStopWorkflowNodeConfig
  | ILaunchTokenPumpfunNodeConfig
  | ILaunchTokenBonkfunNodeConfig
  | IAskAgentNodeConfig
  | IGenerateImageNodeConfig;

export type ISkipSetting = {
  isSkip: boolean;
  leftSide: string;
  condition: string;
  rightSide: string;
};

// UPDATE_PROFILE @workflowType
export type IUpdateProfileNodeConfig = {
  workflowType?: string;
  status?: string;
  name: string;
  onError?: string;
  onSuccess?: string;
  sleep: number;
  timeout?: number;
  skipSetting?: ISkipSetting;
  alertTelegramWhenError?: boolean;

  columnVariable?: string;
  columnVariableName: string;
  columnValue?: string;
};

// CALCULATE @workflowType
export type ICalculateNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the result

  leftSideEquation?: string; // left side of the equation
  equation?: MATH_EQUATION; // equation type
  rightSideEquation?: string; // right side of the equation
  decimal?: number; // decimal places
};

// CHECK_CONDITION @workflowType
export type ICheckConditionNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  leftSide?: string; // left side of the condition
  condition?: COMPARISION_EXPRESSION; // condition to check
  rightSide?: string; // right side of the condition
};

// ON_OFF_PROFILE @workflowType
export type IOnOffProfileNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  leftSide?: string; // left side of the condition
  condition?: COMPARISION_EXPRESSION; // condition to check
  rightSide?: string; // right side of the condition
  profileStatus?: PROFILE_STATUS; // status of the profile
};

// GET_RANDOM_VALUE @workflowType
export type IGetRandomValueNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the result

  type?: RANDOM_OPTION; // type of the random value (RANDOM_NUMBER or RANDOM_VALUE)
  min?: number; // minimum value
  max?: number; // maximum value
  decimal?: number; // decimal places
  listValue?: string[]; // list of values if @type is RANDOM_OPTION.RANDOM_VALUE
};

// SAVE_RESOURCE @workflowType
export type ISaveResourceNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  col1?: string; // value of the first column
  col2?: string; // value of the second column
  col3?: string; // value of the third column
  col4?: string; // value of the fourth column
  col5?: string; // value of the fifth column
  col6?: string; // value of the sixth column
  col7?: string; // value of the seventh column
  col8?: string; // value of the eighth column
  col9?: string; // value of the ninth column
  col10?: string; // value of the tenth column
  col11?: string;
  col12?: string;
  col13?: string;
  col14?: string;
  col15?: string;
  col16?: string;
  col17?: string;
  col18?: string;
  col19?: string;
  col20?: string;
  col21?: string;
  col22?: string;
  col23?: string;
  col24?: string;
  col25?: string;
  col26?: string;
  col27?: string;
  col28?: string;
  col29?: string;
  col30?: string;
  resourceGroup?: number; // resource group id
  encryptKey?: string; // secret key, will be empty as default, user need to input the value manually
  mode?: ENCRYPT_MODE; // encrypt mode
  batchValue?: string; // batch value
  isInsertMultipleResource?: boolean; // is insert multiple resource
};

// SAVE_WALLET @workflowType
export type ISaveWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  phrase?: string; // phrase of the wallet
  address?: string; // address of the wallet
  privateKey?: string; // private key of the wallet
  walletGroup?: number; // wallet group id
  encryptKey?: string; // secret key, will be empty as default, user need to input the value manually
  mode?: ENCRYPT_MODE; // encrypt mode
};

// IMPORT_MARTIAN_WALLET @workflowType
export type IImportMartianWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  seedPhrase?: string; // seed phrase of the wallet
  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password of the wallet, default value is "test_password"
};

// UNLOCK_MARTIAN_WALLET @workflowType
export type IUnlockMartianWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: string;
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password of the wallet, default value is "test_password"
};

// APPROVE_MARTIAN_WALLET @workflowType
export type IApproveMartianWalletNodeConfig = {
  workflowType?: string; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// SWITCH_MARTIAN_WALLET @workflowType
export type ISwitchMartianWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// IMPORT_PHANTOM_WALLET @workflowType
export type IImportPhantomWalletNodeConfig = {
  workflowType?: string; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  seedPhrase?: string; // seed phrase of the wallet
  password?: string; // password of the wallet, default value is "test_password"
  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
};

// UNLOCK_PHANTOM_WALLET @workflowType
export type IUnlockPhantomWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting;
  alertTelegramWhenError?: boolean; // alert telegram when error

  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password of the wallet, default value is "test_password"
};

// CONNECT_PHANTOM_WALLET @workflowType
export type IConnectPhantomWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// CLICK_CONFIRM_PHANTOM_WALLET @workflowType
export type IClickConfirmPhantomWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// IMPORT_RABBY_WALLET @workflowType
export type IImportRabbyWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node

  alertTelegramWhenError?: boolean; // alert telegram when error
  privateKey?: string; // private key of the wallet
  seedPhrase?: string; // seed phrase of the wallet
  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password of the wallet, default value is "test_password"
  importType?: IMPORT_WALLET_TYPE; // import type of the wallet
};

// CONNECT_RABBY_WALLET @workflowType
export type IConnectRabbyWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string;
  ignoreWarning?: boolean;
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// CANCEL_RABBY_WALLET @workflowType
export type ICancelRabbyWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// SIGN_RABBY_WALLET @workflowType
export type ISignRabbyWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  ignoreWarning?: boolean; // ignore warning from Rabby when signing transaction
  isCustomGasLimit?: boolean; // is custom gas limit
  isCustomGasPrice?: boolean; // is custom gas price
  gasOption?: string; // gas option
  gasLimit?: number; // gas limit
  gasPrice?: number; // gas price
};

// UNLOCK_RABBY_WALLET @workflowType
export type IUnlockRabbyWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password of the wallet, default value is "test_password"
};

// ADD_NETWORK_RABBY_WALLET @workflowType
export type IRabbyAddNetworkNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  extensionID?: string; // extension id of the wallet, will be empty in Workflow, will be filled in runtime
  mode?: string; // mode of the network
  chainId?: string; // chain id of the network
  networkName?: string; // name of the network
  rpcUrl?: string; // rpc url of the network
  symbol?: string; // symbol of the network
  blockExplorer?: string; // block explorer of the network
};

// LOGIN_TWITTER @workflowType
export type ILoginTwitterNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  username?: string; // username of the Twitter
  password?: string; // password of the Twitter
};

// CRAWL_TEXT @workflowType
export type ICrawlTextNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the text

  selectorType?: SELECTOR_TYPE; // type of the selector
  cssSelector?: string; // css selector of the text
  xPathSelector?: string; // xpath selector of the text
};

// SET_ATTRIBUTE @workflowType
export type ISetAttributeNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the value

  value?: string; // value of the attribute
  mode?: SET_ATTRIBUTE_MODE; // mode of the attribute
  comparedValue?: string; // compared value of the attribute
  listValue?: IAttributeValue[]; // list value of the attribute
};

export type IAttributeValue = {
  targetValue: string;
  value: string;
};

// OPEN_URL @workflowType
export type IOpenURLNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  url?: string; // url to open
};

// FOLLOW_TWITTER @workflowType
export type IFollowTwitterNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: string;
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  accountUrl?: string; // account url to follow
  action?: FOLLOW_TWITTER_ACTION; // action to perform
};

// LIKE_TWITTER @workflowType
export type ILikeTwitterNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  tweetUrl?: string; // tweet url to like
  action?: LIKE_TWITTER_ACTION; // action to perform
};

// RETWEET_TWITTER @workflowType
export type IReTweetTwitterNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  tweetUrl?: string; // tweet url to retweet
  action?: RETEET_TWITTER_ACTION; // action to perform
};

// REPLY_TWITTER @workflowType
export type IReplyTweetTwitterNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: string;
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  tweetUrl?: string; // tweet url to reply
  comment?: string; // comment to reply
};

// SELECT_TOKEN @workflowType
export type ISelectTokenNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  listOption?: ISelectTokenOption[]; // list of token options
  chainType?: CHAIN_TYPE; // chain type
  nodeEndpointGroupId?: number; // node endpoint group id in database
  walletAddress?: string; // wallet address to select token
};
export type ISelectTokenOption = {
  tokenName: string; // name of the token
  tokenAddress: string; // address of the token
  minimumAmount: string; // minimum amount of the token
};

// SELECT_CHAIN @workflowType
export type ISelectChainNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  listOption: ISelectChainOption[]; // list of chain options
  walletAddress?: string; // wallet address to select chain
};
export type ISelectChainOption = {
  tokenName: string; // name of the token
  tokenAddress: string; // address of the token
  minimumAmount: string; // minimum amount of the token
  chainName: string; // name of the chain
  chainType: CHAIN_TYPE; // chain type
  nodeEndpointGroupId: number | null; // node endpoint group id in database
};

// SEND_TELEGRAM @workflowType
export type ISendTelegramNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  message?: string; // message to send
  imageGIF?: string; // image gif to send
  botToken?: string; // bot token to send
  chatId?: string; // chat id to send
};

// SNIPE_TELEGRAM @workflowType
export type ISnipeTelegramNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to snipe telegram messages
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  botToken?: string; // Bot token for authentication (no phone auth needed)
  chatId?: string; // Chat ID or username to listen to (can be channel username or chat ID)
  variable?: string; // variable name to store the message content
  profileMode?: TELEGRAM_SNIPER_MODE; // profile mode to snipe telegram messages
};

// SAVE_LOG @workflowType
export type ISaveLogNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  content?: string; // content to save
};

// RELOAD_PAGE @workflowType
export type IReloadPageNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// RANDOM_ON_OFF @workflowType
export type IRandomOnOffNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  truePercentage?: number; // true percentage, how many percentage of the time to be true
};

// GO_BACK @workflowType
export type IGoBackNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string;
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
};

// CLOSE_TAB @workflowType
export type ICloseTabNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  selectedTab?: number; // selected tab index
};

// CLICK @workflowType
export type IClickNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  selectorType?: SELECTOR_TYPE; // type of the selector
  cssSelector?: string; // css selector of the text
  xPathSelector?: string; // xpath selector of the text
  listShadowRoot?: string[]; // list of shadow root
};

// CLICK_EXTENSION @workflowType
export type IClickExtensionNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  text?: string; // text to click
};

// UPLOAD_FILE @workflowType
export type IUploadFileNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  selectorType?: SELECTOR_TYPE; // selector type: CSS or XPath
  cssSelector?: string; // CSS selector of the element to click to trigger the file chooser
  xPathSelector?: string; // XPath selector of the element to click to trigger the file chooser
  filePath?: string; // absolute path to the file to upload
};

// CHECK_ELEMENT_EXIST @workflowType
export type ICheckElementExistNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  selectorType?: SELECTOR_TYPE; // type of the selector
  cssSelector?: string; // css selector of the text
  xPathSelector?: string; // xpath selector of the text
  variable?: string; // variable name to store the result
};

// GET_WALLET_BALANCE @workflowType
export type IGetWalletBalanceNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the result

  tokenType?: TOKEN_TYPE; // type of the token
  walletAddress?: string; // wallet address to get the balance
  tokenAddress?: string; // token address to get the balance
  chainType?: CHAIN_TYPE; // chain type to get the balance
  nodeEndpointGroupId?: number; // node endpoint group id in database to get the balance
};

// CONVERT_TOKEN_AMOUNT @workflowType
export type IConvertTokenAmountNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the result

  tokenType?: TOKEN_TYPE; // type of the token
  tokenAddress?: string; // token address to convert the amount
  rawAmount?: string; // raw amount to convert
  chainType?: CHAIN_TYPE; // chain type to convert the amount
  nodeEndpointGroupId?: number; // node endpoint group id in database to convert the amount
};

// TRANSFER_TOKEN @workflowType
export type ITransferTokenNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the result

  tokenType?: TOKEN_TYPE; // type of the token
  chainType?: CHAIN_TYPE; // chain type to transfer the token
  privateKey?: string; // private key of wallet
  toAddress?: string; // to address to transfer the token
  tokenAddress?: string; // token address to transfer the token
  amount?: string; // amount to transfer the token
  nodeEndpointGroupId?: number; // node endpoint group id in database to transfer the token
  gasPrice?: string; // gas price to transfer the token
  gasLimit?: string; // gas limit to transfer the token
};

// EVM_APPROVE_REVOKE_TOKEN @workflowType
export type IApproveRevokeEVMNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  variable?: string; // variable name to store the result
  privateKey?: string; // private key of wallet
  spenderAddress?: string; // spender address to approve the token
  tokenAddress?: string; // token address to approve the token
  amount?: string; // amount to approve the token
  isUnlimitedAmount?: boolean; // is unlimited amount to approve the token
  isRevoke?: boolean; // is revoke the approval
  nodeEndpointGroupId?: number; // node endpoint group id in database to approve the token
  gasPrice?: string; // gas price to approve the token
};

// SWAP_UNISWAP @workflowType
export type ISwapUniswapNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // type of the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error

  variable?: string; // variable name to store the result
  privateKey?: string; // private key of wallet
  swapInput?: ISwapEVMInput; // input data to swap the token
  isUniswap: boolean; // is uniswap to swap the token
  isPancakeSwap: boolean; // is pancakeswap to swap the token
  nodeEndpointGroupId?: number; // node endpoint group id in database to swap the token
  numberOfTrasaction?: number; // number of transaction to swap the token
};
export type ISwapEVMInput = {
  chainId: number; // chain id to swap the token
  poolAddress: string; // pool address to swap the token
  inputTokenAddress: string; // input token address to swap the token
  isInputNativeToken: boolean; // is input native token to swap the token
  inputTokenDecimal: number; // input token decimal to swap the token
  outputTokenAddress: string; // output token address to swap the token
  isOutputNativeToken: boolean; // is output native token to swap the token
  outputTokenDecimal: number; // output token decimal to swap the token
  amount: string; // amount to swap the token
  poolType?: POOL_TYPE; // pool type to swap the token, pool type can be Uniswap or Pancakeswap
  slippage: number; // slippage to swap the token
  priceImpact: number; // price impact to swap the token
  dealineInSecond: number; // dealine in second to swap the token

  gasLimit: ethers.BigNumber; // gas limit to swap the token
  isUseCustomGasLimit: boolean; // is use custom gas limit to swap the token
  transactionType: EVM_TRANSACTION_TYPE; // transaction type to swap the token, transaction type can be LEGACY or EIP_1559, default is "LEGACY"
  maxFeePerGas?: ethers.BigNumber; // max fee per gas to swap the token
  maxPriorityFeePerGas?: ethers.BigNumber; // max priority fee per gas to swap the token
  gasPrice?: ethers.BigNumber; // gas price to swap the token
  isUseCustomGasPrice: boolean; // is use custom gas price to swap the token
  shouldWaitTransactionComfirmed: boolean; // should wait transaction comfirmed to swap the token
};

// SWAP_KYBERSWAP @workflowType
export type ISwapKyberswapNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to swap the token
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error
  variable?: string; // variable name to store the result

  privateKey?: string; // private key to wallet
  swapInput?: ISwapKyberswapInput; // input data to swap the token
  nodeEndpointGroupId?: number; // node endpoint group id in database to swap the token
  numberOfTrasaction?: number; // number of transaction to swap the token
};
export type ISwapKyberswapInput = {
  chainKey: KYBERSWAP_CHAIN_KEY; // chain key to swap the token
  inputTokenAddress: string; // input token address to swap the token
  isInputNativeToken: boolean; // is input native token to swap the token
  inputTokenDecimal: number; // input token decimal to swap the token
  outputTokenAddress: string; // output token address to swap the token
  isOutputNativeToken: boolean; // is output native token to swap the token
  outputTokenDecimal: number; // output token decimal to swap the token
  amount: string; // amount to swap the token
  slippage: number; // slippage to swap the token
  priceImpact: number; // price impact to swap the token
  dealineInSecond: number; // dealine in second to swap the token

  gasLimit: ethers.BigNumber; // gas limit to swap the token
  isUseCustomGasLimit: boolean; // is use custom gas limit to swap the token
  transactionType: EVM_TRANSACTION_TYPE; // transaction type to swap the token, transaction type can be LEGACY or EIP_1559, default is "LEGACY"
  maxFeePerGas?: ethers.BigNumber; // max fee per gas to swap the token
  maxPriorityFeePerGas?: ethers.BigNumber; // max priority fee per gas to swap the token
  gasPrice?: ethers.BigNumber; // gas price to swap the token
  isUseCustomGasPrice: boolean; // is use custom gas price to swap the token
  shouldWaitTransactionComfirmed: boolean; // should wait transaction comfirmed to swap the token
  includedSources: string; // included sources to swap the token, will be empty as default, user need to input the value manually
  excludedSources: string; // excluded sources to swap the token, will be empty as default, user need to input the value manually
};

// SWAP_JUPITER @workflowType
export type ISwapJupiterNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to swap the token
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  privateKey?: string; // private key of wallet
  swapInput?: IJupiterSwapInput; // input data to swap the token
  nodeEndpointGroupId?: number; // node endpoint group id in database to swap the token
  numberOfTrasaction?: number; // number of transaction to swap the token
};
export type IJupiterSwapInput = {
  inputTokenAddress: string; // input token address to swap the token
  inputTokenDecimals: number; // input token decimals to swap the token
  outputTokenAddress: string; // output token address to swap the token
  amount: string; // amount to swap the token
  slippagePercentage: number; // slippage percentage to swap the token
  maxPriceImpactPercentage: number; // max price impact percentage to swap the token
  dynamicSlippage: boolean; // dynamic slippage to swap the token
  pritorityFeeMicroLamport: number; // pritority fee micro lamport to swap the token
  shouldWaitTransactionComfirmed: boolean; // should wait transaction comfirmed to swap the token
};

// SWAP_CETUS @workflowType
export type ISwapCetusNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to swap the token
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  privateKey?: string; // private key of wallet
  swapInput?: ICetusSwapInput; // input data to swap the token
  nodeEndpointGroupId?: number; // node endpoint group id in database to swap the token
  numberOfTrasaction?: number; // number of transaction to swap the token
};
export type ICetusSwapInput = {
  poolAddress: string; // pool address to swap the token
  inputTokenAddress: string; // input token address to swap the token
  outputTokenAddress: string; // output token address to swap the token
  slippagePercentage: number; // slippage percentage to swap the token
  priceImpactPercentage: number; // price impact percentage to swap the token
  amount: string; // amount to swap the token
  shouldWaitTransactionComfirmed: boolean; // should wait transaction comfirmed to swap the token
  gasPrice: number; // gas price to swap the token
};

// EXECUTE_TRANSACTION @workflowType
export type IExecuteTransactionNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to execute the transaction
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  chainType?: CHAIN_TYPE; // chain type to execute the transaction, default is EVM
  privateKey?: string; // private key of wallet
  toAddress?: string; // to address (EVM only)
  transactionData: string; // transaction data: hex for EVM, base64 for Solana
  transactionValue?: string; // transaction value in wei (EVM only)
  nodeEndpointGroupId?: number; // node endpoint group id

  shouldWaitTransactionComfirmed?: boolean; // wait for confirmation
  gasPrice?: string; // gas price in gwei (EVM) or compute unit price in microLamports (Solana)
  gasLimit?: string; // gas limit (EVM) or compute unit limit (Solana)

  // EVM-specific fields
  transactionType?: EVM_TRANSACTION_TYPE; // LEGACY or EIP_1559, default LEGACY
  maxFeePerGas?: ethers.BigNumber; // EIP-1559 max fee per gas
  maxPriorityFeePerGas?: ethers.BigNumber; // EIP-1559 max priority fee per gas
};

// GET_TOKEN_PRICE @workflowType
export type IGetTokenPriceNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to get the token price
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  dataSource?: PRICE_DATA_SOURCE; // data source to get the token price
  coingeckoId?: string; // coingecko id to get the token price, if dataSource is COINGECKO
  tokenAddress?: string; // token address to get the token price, if dataSource is DEXSCREENER
  chainType?: CHAIN_TYPE; // chain type to get the token price, if dataSource is DEXSCREENER
  chainId?: number; // chain id to get the token price, if dataSource is DEXSCREENER
};

// CHECK_TOKEN_PRICE @workflowType
export type ICheckTokenPriceNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to check the token price
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  dataSource?: PRICE_DATA_SOURCE; // data source to check the token price
  coingeckoId?: string; // coingecko id to check the token price, if dataSource is COINGECKO
  tokenAddress?: string; // token address to check the token price, if dataSource is DEXSCREENER
  chainType?: CHAIN_TYPE; // chain type to check the token price, if dataSource is DEXSCREENER
  chainId?: number; // chain id to check the token price, if dataSource is DEXSCREENER
  timeFrame: number; // time frame to check the token price, in seconds
  poolInterval: number; // pool interval to check the token price, in seconds
  compareCondition: COMPARISION_EXPRESSION; // compare condition to check the token price
  compareValue: number; // compare value to check the token price
};

// CHECK_MARKETCAP @workflowType
export type ICheckMarketcapNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to check the marketcap
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  dataSource?: PRICE_DATA_SOURCE; // data source to check the marketcap
  coingeckoId?: string; // coingecko id to check the marketcap, if dataSource is COINGECKO
  tokenAddress?: string; // token address to check the marketcap, if dataSource is DEXSCREENER
  chainType?: CHAIN_TYPE; // chain type to check the marketcap, if dataSource is DEXSCREENER
  chainId?: number; // chain id to check the marketcap, if dataSource is DEXSCREENER
  timeFrame: number; // time frame to check the marketcap, in seconds
  poolInterval: number; // pool interval to check the marketcap, in seconds
  compareCondition: COMPARISION_EXPRESSION; // compare condition to check the marketcap
  compareValue: number; // compare value to check the marketcap
};

// GET_GAS_PRICE @workflowType
export type IGetGasPriceNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to get the gas price
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  chainType?: CHAIN_TYPE; // chain type to get the gas price
  nodeEndpointGroupId?: number; // node endpoint group id in database to get the gas price
};

// GET_PRIORITY_FEE @workflowType, only for Solana chain
export type IGetPriorityFeeNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to get the priority fee
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  nodeEndpointGroupId?: number; // node endpoint group id in database to get the priority fee
  accounts: string; // accounts to get the priority fee
};

// GENERATE_VANITY_ADDRESS @workflowType, only for Solana chain
export type IGenerateVanityAddressNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to get the priority fee
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  prefix?: string; // prefix of the vanity address
  suffix?: string; // suffix of the vanity address
  variableToSaveAddress?: string; // variable name to store the address
  variableToSavePrivateKey?: string; // variable name to store the private key
};

// EVM_SNIPE_CONTRACT @workflowType
export type IEVMSnipeContractNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to snipe the contract
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  input?: ISnipeContractInput; // input to snipe the contract
  nodeEndpointGroupId?: number; // node endpoint group id in database to snipe the contract
  isStartFromCurrentBlock?: boolean; // if true, start from the current block
  contractAbi: string; // contract abi to snipe the contract
  eventName: string; // event name to snipe the contract
};
export type ISnipeContractResult = { [key: string]: any };
export type ISnipeContractInput = {
  contractAddress: string; // contract address to snipe the contract
  eventAbi: string; // event abi to snipe the contract
  listNodeEndpoint: string[]; // list node endpoint to snipe the contract, leave as empty, will be filled in runtime
  fromBlock: number; // from block to snipe the contract
  toBlock: number; // to block to snipe the contract
  blockStep: number; // block step to snipe the contract
  confirmationBlock: number; // confirmation block to snipe the contract
  listVariable: string[]; // list variable to store the result
  profileMode: CONTRACT_SNIPER_MODE; // profile mode to snipe the contract, default is ONE_EVENT_ALL_PROFILE
};

// EVM_READ_FROM_CONTRACT @workflowType
export type IEVMReadFromContractNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to read from the contract
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  contractAddress?: string; // contract address to read from the contract
  contractAbi: string; // contract abi to read from the contract
  nodeEndpointGroupId?: number; // node endpoint group id in database to read from the contract
  listVariable: string[]; // list variable to store the result
  listInput?: string[]; // list input to read from the contract
  method?: string; // method to read from the contract
};

// EVM_WRITE_TO_CONTRACT @workflowType
export type IEVMWriteContractNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to write to the contract
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  privateKey?: string; // private key of wallet
  contractAddress?: string; // contract address to write to the contract
  contractAbi: string; // contract abi to write to the contract
  nodeEndpointGroupId?: number; // node endpoint group id in database to write to the contract
  listInput?: string[]; // list input to write to the contract
  method?: string; // method to write to the contract
  transactionConfig: ITransactionConfigEVM; // transaction config to write to the contract
};
export type ITransactionConfigEVM = {
  gasLimit: string; // gas limit to write to the contract
  isUseCustomGasLimit: boolean; // if true, use custom gas limit
  transactionType: string; // transaction type to write to the contract
  maxFeePerGas?: string; // max fee per gas to write to the contract
  maxPriorityFeePerGas?: string; // max priority fee per gas to write to the contract
  gasPrice?: string; // gas price to write to the contract
  isUseCustomGasPrice: boolean; // if true, use custom gas price
  shouldWaitTransactionComfirmed: boolean; // if true, wait for the transaction to be confirmed
  nativeTokenAmount: string; // native token amount to write to the contract
};

// SCROLL @workflowType
export type IScrollNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to scroll
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  selectorType?: SELECTOR_TYPE; // selector type to scroll
  cssSelector?: string; // css selector to scroll
  xPathSelector?: string; // xpath selector to scroll
  scrollSelector?: SCROLL_TYPE; // scroll selector to scroll
  scrollDirection?: SCROLL_DIRECTION; // scroll direction to scroll
  yAxis: number; // y axis to scroll
};

// TYPE_TEXT @workflowType
export type ITypeTextNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to type text
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  shouldClearInput?: boolean;
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  selectorType?: SELECTOR_TYPE; // selector type to type text
  cssSelector?: string; // css selector to type text
  xPathSelector?: string; // xpath selector to type text
  content: string; // content to type text
  speed: number; // speed to type text
};

// SELECT_TAB @workflowType
export type ISelectTabNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to select tab
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  selectedTab: number; // selected tab index
};

// IMPORT_METAMASK_WALLET @workflowType
export type IImportMetamaskNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to import metamask wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  seedPhrase?: string; // seed phrase to import metamask wallet
  extensionID?: string; // extension id to import metamask wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password to import metamask wallet, default value is "test_password"
};

// UNLOCK_METAMASK_WALLET @workflowType
export type IUnlockMetamaskNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to unlock metamask wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  extensionID?: string; // extension id to unlock metamask wallet, will be empty in Workflow, will be filled in runtime
  password?: string; // password to unlock metamask wallet, default value is "test_password"
};

// CONNECT_METAMASK_WALLET @workflowType
export type IConnectMetamaskNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to connect metamask wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
};

// APPROVE_METAMASK_WALLET @workflowType
export type IApproveMetamaskNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to approve metamask wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
};

// CANCEL_METAMASK_WALLET @workflowType
export type ICancelMetamaskNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to cancel metamask wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
};

// CONFIRM_METAMASK_WALLET @workflowType
export type IConfirmMetamaskNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to confirm metamask wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  isCustomGasLimit?: boolean; // if true, use custom gas limit
  isCustomGasPrice?: boolean; // if true, use custom gas price
  gasOption?: METAMASK_GAS_MODE; // gas option to confirm metamask wallet
  gasLimit?: number; // gas limit to confirm metamask wallet
  maxBaseFee?: number; // max base fee to confirm metamask wallet
  priorityFee?: number; // priority fee to confirm metamask wallet
};

// SOLVE_CAPTCHA @workflowType
export type ISolveCaptchaNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to solve captcha
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  captchaType?: CAPTCHA_TYPE; // captcha type to solve captcha
  twoCaptchaAPIKey?: string;
};

// SWITCH_WINDOW @workflowType
export type ISwitchWindowNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to switch window
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  windowType?: WINDOW_TYPE; // window type to switch window
};

// NEW_TAB @workflowType
export type IOpenNewTabNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to open new tab
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onSuccess?: NODE_ACTION; // action to perform when success
  onError?: NODE_ACTION; // action to perform when error occurs
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  url: string; // url to open new tab
};

// LOOP @workflowType
export type ILoopNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to loop
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  loop?: number; // loop count
};

// EXECUTE_CODE @workflowType
export type IExecuteCodeNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to execute code
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  code?: string; // JavaScript code to execute
  useBrowser?: boolean; // is use browser to execute the code
};

// SELECT_WALLET @workflowType
export type ISelectWalletNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to select wallet
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  compareValue?: string; // compared value of the wallet
  fieldName?: string; // field name of the wallet
  walletGroupId?: number; // wallet group id in database
  encryptKey?: string; // secret key, will be empty as default, user need to input the value manually
  mode?: ENCRYPT_MODE; // encrypt mode
};

// CHECK_RESOURCE @workflowType
export type ICheckResourceNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to check resource
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  compareValue?: string; // compared value of the resource
  fieldName?: string; // field name of the resource
  resourceGroupId?: number; // resource group id in database
  encryptKey?: string; // secret key, will be empty as default, user need to input the value manually
  mode?: ENCRYPT_MODE; // encrypt mode
};

// HTTP_REQUEST @workflowType
export type IHttpRequestNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to send the request
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  url?: string; // url to send the request
  method?: HTTP_METHOD; // method to send the request
  headers?: IKeyValue[]; // headers to send the request
  params?: IKeyValue[]; // parameters to send the request
  requestBody?: string; // request body to send the request
  extractResponseCode?: string; // Javascript code to extract response code from the response
};

// STOP_WORKFLOW @workflowType
export type IStopWorkflowNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to stop the workflow
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
};

// LAUNCH_TOKEN_PUMPFUN @workflowType
export type ILaunchTokenPumpfunNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to launch token pumpfun
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  tokenName?: string; // name of the token
  symbol?: string; // symbol of the token
  description?: string; // description of the token
  imageUrl?: string; // url of image, local file or http url
  twitter?: string; // twitter of the token
  telegram?: string; // telegram of the token
  website?: string; // website of the token
  buyAmountSol?: string; // amount of SOL to buy the token
  slippagePercentage?: number; // slippage percentage to buy the token
  unitLimit?: string; // gas limit
  unitPrice?: string; // gas price in microLamports
  nodeEndpointGroupId?: number; // node endpoint group id in database to launch token pumpfun;
  privateKey?: string; // private key of wallet
  variableTxHash?: string; // variable name to store the transaction hash
  variableTokenAddress?: string; // variable name to store the token address
  vanityAddressPrivateKey?: string; // private key of vanity address
};

// LAUNCH_TOKEN_BONKFUN @workflowType
export enum BONKFUN_LAUNCH_CURRENCY {
  SOL = "SOL",
  USD1 = "USD1",
}
export type ILaunchTokenBonkfunNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to launch token pumpfun
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs

  tokenName?: string; // name of the token
  symbol?: string; // symbol of the token
  description?: string; // description of the token
  imageUrl?: string; // url of image, local file or http url
  twitter?: string; // twitter of the token
  telegram?: string; // telegram of the token
  website?: string; // website of the token
  buyAmountSol?: string; // amount of SOL to buy the token
  slippagePercentage?: number; // slippage percentage to buy the token
  unitLimit?: string; // gas limit
  unitPrice?: string; // gas price in microLamports
  nodeEndpointGroupId?: number; // node endpoint group id in database to launch token pumpfun;
  launchCurrency?: BONKFUN_LAUNCH_CURRENCY; // pool with SOL or USD1
  privateKey?: string; // private key of wallet
  variableTxHash?: string; // variable name to store the transaction hash
  variableTokenAddress?: string; // variable name to store the token address
};

export type IAskAgentNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to launch token pumpfun
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  prompt: string; // prompt to use
  model?: string; // model to use
  apiKey?: string; // api key to use
};

export enum OPENAI_IMAGE_SIZE {
  SIZE_1024_1024 = "1024x1024",
  SIZE_1024_1536 = "1024x1536",
  SIZE_1536_1024 = "1536x1024",
}
export enum OPENAI_IMAGE_QUALITY {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  AUTO = "auto",
}
export type IGenerateImageNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to launch token pumpfun
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  onError?: NODE_ACTION; // action to perform when error occurs
  onSuccess?: NODE_ACTION; // action to perform when success
  sleep: number; // sleep time between each node
  timeout?: number; // timeout for the node
  skipSetting?: ISkipSetting; // skip setting for the node
  alertTelegramWhenError?: boolean; // alert telegram when error occurs
  variable?: string; // variable name to store the result

  prompt: string; // prompt to use
  model?: string; // model to use
  apiKey?: string; // api key to use
  folderPath: string; // folder path to save the image
  fileName: string; // file name to save the image
  size?: OPENAI_IMAGE_SIZE; // size of the image
  quality?: OPENAI_IMAGE_QUALITY; // quality of the image
};

export type IFakeProfile = IWorkflowVariable[];
export type IGenerateProfileNodeConfig = {
  workflowType?: WORKFLOW_TYPE; // workflow type to generate profile
  status?: NODE_STATUS; // status of the node
  name: string; // name of the node
  sleep: number; // sleep time between each node

  listProfile: IFakeProfile[]; // list of fake profiles to generate
};

// Preference
export type IPreference = {
  id?: number;
  nodeBlackList?: string[];
  chatIdTelegram?: number;
  isTelegramOn?: boolean;
  botTokenTelegram?: string;
  isWhatsAppOn?: boolean;
  whatsappAuthState?: string;
  hideMinimap?: boolean;
  key?: string;
  deviceId?: string;
  browserRevision?: string;
  isRevisionDownloaded?: boolean;
  isStopAllSchedule?: boolean;
  dayResetJobStatus?: number;
  maxLogAge?: number;
  maxHistoryLogAge?: number;
  customChromePath?: string;
  maxConcurrentJob?: number;
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleGeminiApiKey?: string;
  openAIModel?: string;
  anthropicModel?: string;
  googleGeminiModel?: string;
  jupiterApiKeys?: string[];
  tavilyApiKey?: string;
  exaApiKey?: string;
  masterPasswordVerifier?: string;
  disabledTools?: string[];
};

// Statistic
export type IStatistic = {
  totalWalletGroup: number;
  totalWallet: number;
  totalProfileGroup: number;
  totalProfile: number;
  totalResourceGroup: number;
  totalResource: number;
  totalCampaign: number;
  totalWorkflow: number;
  totalMcpServer: number;
  totalAgentSkill: number;
};

export type IFolder = {
  name: string;
  path: string;
  lastEdit: number;
  size: number;
};

export type IFile = {
  path: string;
  size: number;
};

export type IProxyService = {
  type: string;
  name: string;
  background: string;
  color: string;
  website?: string;
};

export type IProfileProxy = {
  isUseProxy?: boolean;
  proxyType?: string;
  proxyIp?: IProxyIp;
  proxyService?: string;
};

export type ISchedule = {
  id?: number;
  name?: string;
  note?: string;
  type?: ScheduleType;
  isActive?: boolean;
  isCompleted?: boolean;
  isRunning?: boolean;
  lastEndTime?: number;
  listJob?: IJob[];
  createAt?: number;
  updateAt?: number;

  // workflow schedule
  repeat?: string;
  repeatPerDay?: string;
  durationBetweenRun?: number;
  startTime?: number;
  alertTelegram?: boolean;
  onlyRunOnce?: boolean;

  // agent schedule
  cronExpr?: string;
  isPaused?: boolean;
  memoryFileKey?: string; // Custom filename key for the agent's isolated memory file (AGENT_<memoryFileKey>.md).Defaults to schedule ID
  lastStartedAt?: number;
  nextRunAt?: number; // computed from cronExpr, not stored in DB
  recentLogs?: IScheduleLog[]; // last N logs, not stored in DB
};

export type IJob = {
  id?: number;
  type?: JobType;
  scheduleId?: number;
  schedule?: ISchedule;
  order?: number;
  isRunWithSchedule?: boolean;
  isCompleted?: boolean;
  isRunning?: boolean;
  lastRunTime?: number;
  lastEndTime?: number;
  createAt?: number;
  updateAt?: number;

  // workflow job
  workflowId?: number | null;
  workflow?: IWorkflow;
  campaignId?: number | null;
  campaign?: ICampaign;
  secretKey?: string;
  timeout?: number;
  startTime?: string;
  onlyRunOnce?: boolean;

  // agent job
  prompt?: string;
  notifyPlatform?: string;
  notifyOnlyIfAgentSays?: boolean;
  toolContextJson?: string;
  useOutputFromPrev?: boolean; // If true, the previous job's result is injected as context into this job's prompt
  conditionType?: JobConditionType;
  conditionPrompt?: string;
  maxRetries?: number;
  retryDelayMinutes?: number;
  llmProvider?: string; // LLM provider to use when running this job (defaults to CLAUDE)

  // virtual — not stored in DB, merged at read time
  lastLog?: IScheduleLog;
};

export type IScheduleLog = {
  // common
  id?: number;
  scheduleId?: number;
  schedule?: ISchedule;
  type?: string;
  createAt?: number;
  updateAt?: number;

  // workflow log
  workflowId?: number | null;
  workflow?: IWorkflow;
  campaignId?: number | null;
  campaign?: ICampaign;

  // agent log
  jobId?: number;
  status?: AgentScheduleStatus;
  result?: string;
  errorMessage?: string;
  retryCount?: number;
  nextRetryAt?: number;
  startedAt?: number;
  finishedAt?: number;
};

export type ISorter = {
  field: string;
  order: string;
};

export type ColumnConfig = {
  variable: string | null | undefined;
  dataIndex: string | null | undefined;
  title: string | null | undefined;
  width?: string;
};

export type IRunningWorkflow = {
  campaignId: number;
  workflowId: number;
  scheduleId: number;
};

export type IKeyValue = {
  key: string;
  value: string;
};

export type IDeleteDependency = {
  listCampaign: ICampaign[];
  listProfileGroup: IProfileGroup[];
};

export type ICampaignProfileColumn = {
  variable?: string;
  label?: string;
  fieldName: string;
  value?: string;
};

export type IGlobalSearchResult = {
  campaigns: ICampaign[];
  workflows: IWorkflow[];
  schedules: ISchedule[];
  walletGroups: IWalletGroup[];
  resourceGroups: IResourceGroup[];
  profileGroups: IProfileGroup[];
  proxyIpGroups: IProxyIpGroup[];
  nodeEndpointGroups: INodeEndpointGroup[];
};

export enum MCPServerStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

export type IMcpServer = {
  id?: number;
  name: string;
  description?: string;
  config?: string;
  commandOrUrl?: string;
  isEnabled: boolean;
  status?: MCPServerStatus;
  lastError?: string;
  toolsCount?: number;
  disabledTools?: string[];
  createAt?: number;
  updateAt?: number;
};

export type IAgentSkill = {
  id?: number;
  name: string;
  description?: string;
  folderName?: string;
  isEnabled: boolean;
  createAt?: number;
  updateAt?: number;
  filePath?: string;
};

export type IAgentSetting = {
  id?: number;
  name: string;
  type: string;
  data: string;
  createAt?: number;
  updateAt?: number;
};

export enum AGENT_SETTING_TYPE {
  AGENT_PRESET = "AGENT_PRESET",
}
