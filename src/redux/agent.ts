import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LLMProvider } from "@/electron/type";
import { RootState } from "./store";

export enum AGENT_LAYOUT_MODE {
  TRADE_OPTIMIZE = "TRADE_OPTIMIZE",
  CHAT_OPTIMIZE = "CHAT_OPTIMIZE",
}

export interface IAgentContext {
  chainKey: string;
  nodeEndpointGroupId: number | null;
  tokenAddress: string;
  campaignId: number | null;
  listProfileId: number[] | null;
  isAllWallet: boolean;
}

export const defaultAgentContext: IAgentContext = {
  chainKey: "",
  nodeEndpointGroupId: null,
  tokenAddress: "",
  campaignId: null,
  listProfileId: [],
  isAllWallet: false,
};

interface IAgentState {
  selectedAgentProfileId: number | null;
  agentContextMap: Record<number, IAgentContext>;
  layoutMode: AGENT_LAYOUT_MODE;
  splitPercent: number;
  llmProvider: LLMProvider;
  agentStats: {
    subAgentsCount: number;
    toolsCount: number;
    skillsCount: number;
  } | null;
}

const initialState: IAgentState = {
  selectedAgentProfileId: null,
  agentContextMap: {},
  layoutMode: AGENT_LAYOUT_MODE.TRADE_OPTIMIZE,
  splitPercent: 50,
  llmProvider: LLMProvider.CLAUDE,
  agentStats: null,
};

const ensureContext = (state: IAgentState): IAgentContext | null => {
  if (!state.selectedAgentProfileId) {
    return null;
  }
  if (!state.agentContextMap) {
    state.agentContextMap = {};
  }
  if (!state.agentContextMap[state.selectedAgentProfileId]) {
    state.agentContextMap[state.selectedAgentProfileId] = {
      ...defaultAgentContext,
    };
  }
  return state.agentContextMap[state.selectedAgentProfileId];
};

export const agentSlice = createSlice({
  name: "Agent",
  initialState,
  reducers: {
    actSaveSelectedAgentProfileId: (
      state: IAgentState,
      action: PayloadAction<number | null>,
    ) => {
      state.selectedAgentProfileId = action.payload;
      state.agentStats = null;
    },
    actSaveChainKey: (state: IAgentState, action: PayloadAction<string>) => {
      const context = ensureContext(state);
      if (!context) {
        return;
      }
      context.chainKey = action.payload;
    },
    actSaveNodeEndpointGroupId: (
      state: IAgentState,
      action: PayloadAction<number | null>,
    ) => {
      const context = ensureContext(state);
      if (!context) {
        return;
      }
      context.nodeEndpointGroupId = action.payload;
    },
    actSaveTokenAddress: (
      state: IAgentState,
      action: PayloadAction<string>,
    ) => {
      const context = ensureContext(state);
      if (!context) {
        return;
      }
      context.tokenAddress = action.payload;
    },
    actSaveCampaignId: (
      state: IAgentState,
      action: PayloadAction<number | null>,
    ) => {
      const context = ensureContext(state);
      if (!context) {
        return;
      }
      context.campaignId = action.payload;
    },
    actSaveListProfileId: (
      state: IAgentState,
      action: PayloadAction<number[] | null>,
    ) => {
      const context = ensureContext(state);
      if (!context) {
        return;
      }
      context.listProfileId = action.payload;
    },
    actSaveIsAllWallet: (
      state: IAgentState,
      action: PayloadAction<boolean>,
    ) => {
      const context = ensureContext(state);
      if (!context) {
        return;
      }
      context.isAllWallet = action.payload;
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
    actRemoveAgentContext: (
      state: IAgentState,
      action: PayloadAction<number>,
    ) => {
      delete state.agentContextMap[action.payload];
    },
  },
});

export const {
  actSaveSelectedAgentProfileId,
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
  actRemoveAgentContext,
} = agentSlice.actions;

export { LLMProvider };

export const agentSelector = (state: RootState) => state.Agent;
export default agentSlice.reducer;
