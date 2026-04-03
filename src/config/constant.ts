import { WORKFLOW_TYPE } from "@/electron/constant";

export const RESPONSE_CODE = {
  SUCCESS: 200,
  ERROR: 400,
  MISSING_QUERY: 301,
  MISSING_PARAMS: 302,
  MISSING_BODY: 303,
  INVALID_QUERY: 304,
  INVALID_PARAMS: 305,
  INVALID_BODY: 306,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 402,
  INVALID: 403,
  OBJECT_NOT_FOUND: 404,
  OBJECT_EXIST: 405,
  EXCEPTION_ERROR: 406,
  DATABASE_ERROR: 407,
  EXCEED: 408,
  EXPIRED: 409,
  SERVER_EXCEPTION: 500,
  PERMISSON_DENIED: 502,
  SEARCH_NOT_FOUND: 601,
};

export const EMPTY_STRING = "--";

export const COLORS = [
  "#13c2c2",
  "#52c41a",
  "#1677ff",
  "#722ed1",
  "#eb2f96",
  "#fa541c",
  "#faad14",
  "#a0d911",
  "#fadb14",
  "#fa8c16",
];
export const DEFAULT_COLOR_PICKER = "#97bac9";

export const FILE_TYPE = {
  TXT: "txt",
  XLSX: "xlsx",
  ZIP: "zip",
  CRX: "crx",
  SQL: "sql",
};

export const EDGE_TYPE = {
  FLOATING: "FLOATING",
};

export const SCRIPT_NAME_EN = {
  [WORKFLOW_TYPE.ASK_AGENT]: "Ask agent",
  [WORKFLOW_TYPE.GENERATE_IMAGE]: "Generate image",

  [WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN]: "Pump Fun",
  [WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN]: "Bonk Fun",

  [WORKFLOW_TYPE.OPEN_URL]: "Open URL",
  [WORKFLOW_TYPE.CLICK]: "Click",
  [WORKFLOW_TYPE.NEW_TAB]: "Open new tab",
  [WORKFLOW_TYPE.SELECT_TAB]: "Select tab",
  [WORKFLOW_TYPE.CLOSE_TAB]: "Close tab",
  [WORKFLOW_TYPE.GO_BACK]: "Back",
  [WORKFLOW_TYPE.RELOAD_PAGE]: "Reload page",
  [WORKFLOW_TYPE.TYPE_TEXT]: "Type text",
  [WORKFLOW_TYPE.EXECUTE_CODE]: "Execute code",
  [WORKFLOW_TYPE.HTTP_REQUEST]: "HTTP request",
  [WORKFLOW_TYPE.SCROLL]: "Scroll",
  [WORKFLOW_TYPE.COMMENT]: "Note",
  [WORKFLOW_TYPE.SWITCH_WINDOW]: "Select window",
  [WORKFLOW_TYPE.SOLVE_CAPTCHA]: "Solve captcha",
  [WORKFLOW_TYPE.LOOP]: "Loop",
  [WORKFLOW_TYPE.GENERATE_PROFILE]: "Create profile",
  [WORKFLOW_TYPE.SET_ATTRIBUTE]: "Set variable",
  [WORKFLOW_TYPE.CRAWL_TEXT]: "Crawl text",
  [WORKFLOW_TYPE.CHECK_CONDITION]: "Check condition",
  [WORKFLOW_TYPE.CHECK_ELEMENT_EXIST]: "Element exist",
  [WORKFLOW_TYPE.CLICK_EXTENSION]: "Click extension",
  [WORKFLOW_TYPE.UPLOAD_FILE]: "Upload file",
  [WORKFLOW_TYPE.GET_RANDOM_VALUE]: "Random value",
  [WORKFLOW_TYPE.RANDOM_ON_OFF]: "Random On/Off",
  [WORKFLOW_TYPE.CALCULATE]: "Calculate",

  [WORKFLOW_TYPE.SEND_TELEGRAM]: "Bot message",
  [WORKFLOW_TYPE.SNIPE_TELEGRAM]: "Snipe telegram",

  [WORKFLOW_TYPE.LOGIN_TWITTER]: "Login Twitter",
  [WORKFLOW_TYPE.FOLLOW_TWITTER]: "Follow account",
  [WORKFLOW_TYPE.LIKE_TWITTER]: "Like Tweet",
  [WORKFLOW_TYPE.RETWEET_TWITTER]: "ReTweet",
  [WORKFLOW_TYPE.REPLY_TWITTER]: "Reply Tweet",

  [WORKFLOW_TYPE.IMPORT_METAMASK_WALLET]: "Import wallet",
  [WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET]: "Unlock wallet",
  [WORKFLOW_TYPE.CONNECT_METAMASK_WALLET]: "Connect wallet",
  [WORKFLOW_TYPE.APPROVE_METAMASK_WALLET]: "Click Approve",
  [WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET]: "Click Confirm",
  [WORKFLOW_TYPE.CANCEL_METAMASK_WALLET]: "Click Cancel",

  [WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET]: "Import wallet",
  [WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET]: "Unlock wallet",
  [WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET]: "Click Approve",
  [WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET]: "Click Switch",

  [WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET]: "Import wallet",
  [WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET]: "Unlock wallet",
  [WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET]: "Connect wallet",
  [WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET]: "Click Confirm",

  [WORKFLOW_TYPE.IMPORT_RABBY_WALLET]: "Import wallet",
  [WORKFLOW_TYPE.UNLOCK_RABBY_WALLET]: "Unlock wallet",
  [WORKFLOW_TYPE.CONNECT_RABBY_WALLET]: "Connect wallet",
  [WORKFLOW_TYPE.CANCEL_RABBY_WALLET]: "Click Cancel",
  [WORKFLOW_TYPE.SIGN_RABBY_WALLET]: "Sign wallet",
  [WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET]: "Add network",

  [WORKFLOW_TYPE.GET_WALLET_BALANCE]: "Get balance",
  [WORKFLOW_TYPE.TRANSFER_TOKEN]: "Transfer token",
  [WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN]: "Approve token",
  [WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]: "Contract sniper",
  [WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT]: "Read contract",
  [WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT]: "Write to contract",
  [WORKFLOW_TYPE.EXECUTE_TRANSACTION]: "Execute tx",
  [WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT]: "Convert decimals",
  [WORKFLOW_TYPE.GET_GAS_PRICE]: "Get gas price",
  [WORKFLOW_TYPE.GET_PRIORITY_FEE]: "Get priority fee",
  [WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS]: "Vanity address",
  [WORKFLOW_TYPE.GET_TOKEN_PRICE]: "Get token price",
  [WORKFLOW_TYPE.CHECK_TOKEN_PRICE]: "Check token price",
  [WORKFLOW_TYPE.CHECK_MARKETCAP]: "Check marketcap",
  [WORKFLOW_TYPE.SELECT_TOKEN]: "Select token",
  [WORKFLOW_TYPE.SELECT_CHAIN]: "Select chain",
  [WORKFLOW_TYPE.SAVE_WALLET]: "Save wallet",
  [WORKFLOW_TYPE.SELECT_WALLET]: "Select wallet",
  [WORKFLOW_TYPE.SAVE_RESOURCE]: "Save resource",
  [WORKFLOW_TYPE.CHECK_RESOURCE]: "Select resource",
  [WORKFLOW_TYPE.STOP_SCRIPT]: "Stop workflow",
  [WORKFLOW_TYPE.UPDATE_PROFILE]: "Update profile",
  [WORKFLOW_TYPE.ON_OFF_PROFILE]: "On/Off profile",

  [WORKFLOW_TYPE.SWAP_UNISWAP]: "Swap Uniswap",
  [WORKFLOW_TYPE.SWAP_PANCAKESWAP]: "Swap PancakeSwap",
  [WORKFLOW_TYPE.SWAP_CETUS]: "Swap Cetus",
  [WORKFLOW_TYPE.SWAP_KYBERSWAP]: "Swap Kyberswap",
  [WORKFLOW_TYPE.SWAP_JUPITER]: "Swap Jupiter",

  [WORKFLOW_TYPE.SAVE_LOG]: "Save log",
};

export const NODE_CATEGORY_LABEL_EN = {
  BROWSER: "Browser",
  ONCHAIN: "On-Chain",
  METAMASK_WALLET: "Metamask wallet",
  PHANTOM_WALLET: "Phantom Wallet",
  MARTIAN_WALLET: "Martian Wallet",
  RABBY_WALLET: "Rabby Wallet",
  ADVANCED: "Advanced",
  TWITTER: "Twitter",
  TELEGRAM: "Telegram",
  OTHER: "Others",
  SWAP: "Swap",
  LAUNCH_TOKEN: "Launch token",
  AGENT: "Agent",
};

export const FOLDER_TYPE = {
  PROFILE: "PROFILE",
  BROWSER: "BROWSER",
  EXTENSION: "EXTENSION",
  TEMP: "TEMP",
  SKILL: "SKILL",
};

export const DEFAULT_SLEEP_TIME = 3;
export const SAMPLE_XPATH = "//button[contains(text(), 'Connect Wallet')]";

export const WORKFLOW_PATHNAME = "/dashboard/workflow";
export const CAMPAIGN_PATHNAME = "/dashboard/campaign";

export const CLOSE_ALL_PROFILE = "CLOSE_ALL_PROFILE";

export const CAMPAIGN_VIEW_MODE = {
  VIEW_CAMPAIGN: "VIEW_CAMPAIGN",
  VIEW_PROFILE: "VIEW_PROFILE",
  VIEW_WORKFLOW: "VIEW_WORKFLOW",
};

export const SQL_FOREIGNKEY_ERROR =
  "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed";

export const DASHBOARD_LIGHT_MODE_KEY = "dashboard_light_mode_preference";
export const LAST_ROUTE_BEFORE_LOCK_KEY = "last_route_before_lock";
export const TABLE_PAGE_OPTION = [50, 100, 500];
