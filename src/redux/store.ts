import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore, createMigrate } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { migration, CURRENT_REDUX_PERSIST_VERSION } from "@/redux/migration";
import authReducer from "./auth";
import sessionReducer from "./session";
import layoutReducer from "./layout";
import walletGroupReducer from "./walletGroup";
import walletReducer from "./wallet";
import resourceGroupReducer from "./resourceGroup";
import resourceReducer from "./resource";
import profileReducer from "./profile";
import profileGroupReducer from "./profileGroup";
import extensionReducer from "./extension";
import proxyReducer from "./proxy";
import workflowRunnerReducer from "./workflowRunner";
import workflowReducer from "./workflow";
import campaignReducer from "./campaign";
import campaignProfileReducer from "./campaignProfile";
import preferenceReducer from "./preference";
import proxyIpGroupReducer from "./proxyIpGroup";
import proxyIpReducer from "./proxyIp";
import nodeEndpointReducer from "./nodeEndpoint";
import nodeEndpointGroupReducer from "./nodeEndpointGroup";
import folderReducer from "./folder";
import browserReducer from "./browser";
import userLogReducer from "./userLog";
import scheduleReducer from "./schedule";
import jobReducer from "./job";
import scheduleLogReducer from "./scheduleLog";
import systemLogReducer from "./systemLog";
import searchReducer from "./search";
import agentReducer from "./agent";
import mcpServerReducer from "./mcpServer";
import agentSkillReducer from "./agentSkill";
import agentSettingReducer from "./agentSetting";
import agentRegistryReducer from "./agentRegistry";
import agentTaskReducer from "./agentTask";

const reducers = combineReducers({
  Auth: authReducer,
  Session: sessionReducer,
  Layout: layoutReducer,
  WalletGroup: walletGroupReducer,
  Wallet: walletReducer,
  ResourceGroup: resourceGroupReducer,
  Search: searchReducer,
  Resource: resourceReducer,
  Profile: profileReducer,
  ProfileGroup: profileGroupReducer,
  Extension: extensionReducer,
  Proxy: proxyReducer,
  WorkflowRunner: workflowRunnerReducer,
  Workflow: workflowReducer,
  Campaign: campaignReducer,
  CampaignProfile: campaignProfileReducer,
  Preference: preferenceReducer,
  ProxyIpGroup: proxyIpGroupReducer,
  ProxyIp: proxyIpReducer,
  NodeEndpoint: nodeEndpointReducer,
  NodeEndpointGroup: nodeEndpointGroupReducer,
  Folder: folderReducer,
  Browser: browserReducer,
  Schedule: scheduleReducer,
  Job: jobReducer,
  ScheduleLog: scheduleLogReducer,
  UserLog: userLogReducer,
  SystemLog: systemLogReducer,
  Agent: agentReducer,
  McpServer: mcpServerReducer,
  AgentSkill: agentSkillReducer,
  AgentSetting: agentSettingReducer,
  AgentRegistry: agentRegistryReducer,
  AgentTask: agentTaskReducer,
});

const persistedReducer = persistReducer(
  {
    key: "root",
    storage,
    whitelist: [
      "Layout",
      "WorkflowRunner",
      "Preference",
      "WalletGroup",
      "Wallet",
      "ResourceGroup",
      "Resource",
      "ProfileGroup",
      "Profile",
      "Proxy",
      "Workflow",
      "Campaign",
      "Schedule",
      "ScheduleLog",
      "SystemLog",
      "Agent",
      "McpServer",
      "AgentSkill",
      "AgentSetting",
      "CampaignProfile",
      "NodeEndpoint",
      "NodeEndpointGroup",
      "ProxyIp",
      "ProxyIpGroup",
      "UserLog",
      "AgentRegistry",
    ],
    migrate: createMigrate(migration, { debug: true }),
    version: CURRENT_REDUX_PERSIST_VERSION,
  },
  reducers,
);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof reducers>;
export type AppDispatch = typeof store.dispatch;
