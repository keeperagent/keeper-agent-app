import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  createMigrate,
  createTransform,
} from "redux-persist";
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
import workflowRunnerReducer from "./workflowRunner";
import workflowReducer from "./workflow";
import campaignReducer from "./campaign";
import campaignProfileReducer from "./campaignProfile";
import preferenceReducer from "./preference";
import staticProxyGroupReducer from "./staticProxyGroup";
import staticProxyReducer from "./staticProxy";
import nodeEndpointReducer from "./nodeEndpoint";
import nodeEndpointGroupReducer from "./nodeEndpointGroup";
import folderReducer from "./folder";
import browserReducer from "./browser";
import scheduleReducer from "./schedule";
import jobReducer from "./job";
import systemLogReducer from "./systemLog";
import searchReducer from "./search";
import agentReducer from "./agent";
import mcpServerReducer from "./mcpServer";
import agentSkillReducer from "./agentSkill";
import settingReducer from "./setting";
import agentProfileReducer from "./agentProfile";
import agentTaskReducer from "./agentTask";
import appLogReducer from "./appLog";

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
  WorkflowRunner: workflowRunnerReducer,
  Workflow: workflowReducer,
  Campaign: campaignReducer,
  CampaignProfile: campaignProfileReducer,
  Preference: preferenceReducer,
  StaticProxyGroup: staticProxyGroupReducer,
  StaticProxy: staticProxyReducer,
  NodeEndpoint: nodeEndpointReducer,
  NodeEndpointGroup: nodeEndpointGroupReducer,
  Folder: folderReducer,
  Browser: browserReducer,
  Schedule: scheduleReducer,
  Job: jobReducer,
  SystemLog: systemLogReducer,
  Agent: agentReducer,
  McpServer: mcpServerReducer,
  AgentSkill: agentSkillReducer,
  Setting: settingReducer,
  AgentProfile: agentProfileReducer,
  AgentTask: agentTaskReducer,
  AppLog: appLogReducer,
});

const stripSensitiveListTransform = createTransform(
  (inboundState: any, key) => {
    if (key === "Wallet") {
      const { listWallet, selectedWallet, ...rest } = inboundState;
      return rest;
    }
    if (key === "Resource") {
      const { listResource, selectedResource, ...rest } = inboundState;
      return rest;
    }
    if (key === "Profile") {
      const { listProfile, selectedProfile, ...rest } = inboundState;
      return rest;
    }
    if (key === "CampaignProfile") {
      const { listCampaignProfile, selectedCampaignProfile, ...rest } =
        inboundState;
      return rest;
    }
    return inboundState;
  },
  (outboundState: any) => outboundState,
  { whitelist: ["Wallet", "Resource", "Profile", "CampaignProfile"] },
);

const persistedReducer = persistReducer(
  {
    key: "root",
    storage,
    transforms: [stripSensitiveListTransform],
    whitelist: [
      "Layout",
      "WorkflowRunner",
      "Preference",
      "WalletGroup",
      "ResourceGroup",
      "ProfileGroup",
      "Proxy",
      "Workflow",
      "Campaign",
      "Schedule",
      "SystemLog",
      "Agent",
      "McpServer",
      "AgentSkill",
      "Setting",
      "NodeEndpoint",
      "NodeEndpointGroup",
      "StaticProxy",
      "StaticProxyGroup",
      "AgentProfile",
      "AppLog",
      "Wallet",
      "Resource",
      "Profile",
      "CampaignProfile",
    ],
    migrate: createMigrate(migration, { debug: true }),
    version: CURRENT_REDUX_PERSIST_VERSION,
  },
  reducers as any,
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
