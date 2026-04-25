import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LLMProvider } from "@/electron/type";
import { RootState } from "./store";

export enum AGENT_LAYOUT_MODE {
  TRADE_OPTIMIZE = "TRADE_OPTIMIZE",
  CHAT_OPTIMIZE = "CHAT_OPTIMIZE",
}

interface IAgentState {
  chainKey: string; // @chainKey will equal to dexscreener key
  nodeEndpointGroupId: number | null;
  tokenAddress: string;
  campaignId: number | null;
  listProfileId: number[] | null;
  isAllWallet: boolean;
  layoutMode: AGENT_LAYOUT_MODE;
  splitPercent: number;
  llmProvider: LLMProvider;
  agentStats: {
    subAgentsCount: number;
    toolsCount: number;
    skillsCount: number;
  } | null;
  chatProfileId: number | null;
}

const initialState: IAgentState = {
  chainKey: "",
  nodeEndpointGroupId: null,
  tokenAddress: "",
  campaignId: null,
  listProfileId: [],
  isAllWallet: false,
  layoutMode: AGENT_LAYOUT_MODE.TRADE_OPTIMIZE,
  splitPercent: 50,
  llmProvider: LLMProvider.CLAUDE,
  agentStats: null,
  chatProfileId: null,
};

export const agentSlice = createSlice({
  name: "Agent",
  initialState,
  reducers: {
    actSaveChainKey: (state: IAgentState, action: PayloadAction<string>) => {
      state.chainKey = action.payload;
    },
    actSaveNodeEndpointGroupId: (
      state: IAgentState,
      action: PayloadAction<number | null>,
    ) => {
      state.nodeEndpointGroupId = action.payload;
    },
    actSaveTokenAddress: (
      state: IAgentState,
      action: PayloadAction<string>,
    ) => {
      state.tokenAddress = action.payload;
    },
    actSaveCampaignId: (
      state: IAgentState,
      action: PayloadAction<number | null>,
    ) => {
      state.campaignId = action.payload;
    },
    actSaveListProfileId: (
      state: IAgentState,
      action: PayloadAction<number[] | null>,
    ) => {
      state.listProfileId = action.payload;
    },
    actSaveIsAllWallet: (
      state: IAgentState,
      action: PayloadAction<boolean>,
    ) => {
      state.isAllWallet = action.payload;
    },
    actSetLayoutMode: (
      state: IAgentState,
      action: PayloadAction<AGENT_LAYOUT_MODE>,
    ) => {
      state.layoutMode = action.payload;
    },
    actSetSplitPercent: (state: IAgentState, action: PayloadAction<number>) => {
      state.splitPercent = action.payload;
    },
    actSetLLMProvider: (
      state: IAgentState,
      action: PayloadAction<LLMProvider>,
    ) => {
      state.llmProvider = action.payload;
    },
    actSaveAgentStats: (
      state: IAgentState,
      action: PayloadAction<{
        subAgentsCount: number;
        toolsCount: number;
        skillsCount: number;
      } | null>,
    ) => {
      state.agentStats = action.payload;
    },
    actSaveChatProfileId: (
      state: IAgentState,
      action: PayloadAction<number | null>,
    ) => {
      state.chatProfileId = action.payload;
    },
  },
});

export const {
  actSaveChainKey,
  actSaveNodeEndpointGroupId,
  actSaveTokenAddress,
  actSaveCampaignId,
  actSaveListProfileId,
  actSaveIsAllWallet,
  actSetLayoutMode,
  actSetSplitPercent,
  actSetLLMProvider,
  actSaveAgentStats,
  actSaveChatProfileId,
} = agentSlice.actions;
export { LLMProvider };
export const agentSelector = (state: RootState) => state.Agent;
export default agentSlice.reducer;
