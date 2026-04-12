import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { Node, Edge } from "@xyflow/react";
import {
  IFlowProfile,
  IRunningWorkflow,
  IWorkflowVariable,
  ISnipeContractResult,
} from "@/electron/type";
import { RootState } from "./store";

export type IFlowState = {
  nodes: Node[];
  edges: Edge[];
};
export type IUndoRedo = {
  present: IFlowState;
  past: IFlowState[];
  future: IFlowState[];
  redoable: boolean;
  undoable: boolean;
};

export type CacheItem = {
  key: string;
  value: any;
  createdAt: number;
};

export type IWorkflowRunnerState = {
  isRunning: boolean;
  selectedNodeID: string | null;
  selectedEdgeID: string | null;
  isModalOpen: boolean;
  isModalQueueOpen: boolean;
  isModalPreferenceOpen: boolean;
  isModalSettingOpen: boolean;
  numberOfThread: number;
  mapThread: {
    [threadID: string]: IFlowProfile;
  };
  mapMinMaxDuration: {
    [nodeID: string]: {
      min: number;
      max: number;
    };
  };
  mapError: {
    [nodeID: string]: { timestamp: number; message: string };
  };
  mapExtensionID: { [extensionKey: string]: string };
  mapNodeSlots: { [nodeID: string]: number };
  isFullScreen: boolean;

  flowData: IUndoRedo;
  isShowModalInstruction: boolean;
  selectedWorkflowType: string | null;
  isSaved: boolean;
  alertBeforeQuit: boolean;
  sampleContractSniperResults: ISnipeContractResult[];
  totalContractSniperResult: number;
  isModalSampleContractSniperResultOpen: boolean;
  contractSniperResultLastUpdate: number;
  currentRound: number;
  isSleeping: boolean;
  listRunningWorkflow: IRunningWorkflow[];
  isModalAnalyzeVariableOpen: boolean;
  selectedVariable: IWorkflowVariable | null;
  isModalPriceCheckingOpen: boolean;
  isModalMarketcapCheckingOpen: boolean;
  priceCheckingData: CacheItem[];
  marketcapCheckingData: CacheItem[];
};

export const initialFlowData = {
  present: { nodes: [], edges: [] },
  past: [],
  future: [],
  redoable: false,
  undoable: false,
};

const initialState: IWorkflowRunnerState = {
  isRunning: false,
  selectedNodeID: null,
  selectedEdgeID: null,
  isModalOpen: false,
  isModalQueueOpen: false,
  isModalPreferenceOpen: false,
  isModalSettingOpen: false,
  numberOfThread: 1,
  mapThread: {},
  mapError: {},
  mapExtensionID: {},
  mapMinMaxDuration: {},
  mapNodeSlots: {},
  isFullScreen: false,
  flowData: initialFlowData,
  isShowModalInstruction: false,
  selectedWorkflowType: null,
  isSaved: false,
  alertBeforeQuit: false,
  sampleContractSniperResults: [],
  totalContractSniperResult: 0,
  isModalSampleContractSniperResultOpen: false,
  contractSniperResultLastUpdate: 0,
  isModalPriceCheckingOpen: false,
  isModalMarketcapCheckingOpen: false,
  currentRound: 0,
  isSleeping: false,
  listRunningWorkflow: [],
  isModalAnalyzeVariableOpen: false,
  selectedVariable: null,
  priceCheckingData: [],
  marketcapCheckingData: [],
};

export const workflowSlice = createSlice({
  name: "WorkflowRunner",
  initialState,
  reducers: {
    actSetIsRun: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isRunning = action.payload;
    },
    actSetModalOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<any>,
    ) => {
      state.isModalOpen = action.payload;
    },
    actSetModalQueueOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<any>,
    ) => {
      state.isModalQueueOpen = action.payload;
    },
    actSetModalPreferenceOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<any>,
    ) => {
      state.isModalPreferenceOpen = action.payload;
    },
    actSaveSelectedNode: (
      state: IWorkflowRunnerState,
      action: PayloadAction<string | null>,
    ) => {
      state.selectedNodeID = action.payload;
    },
    actSaveSelectedEdge: (
      state: IWorkflowRunnerState,
      action: PayloadAction<string | null>,
    ) => {
      state.selectedEdgeID = action.payload;
    },
    actCleanThread: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ threadID: string }>,
    ) => {
      const { threadID } = action.payload;
      if (threadID !== undefined) {
        delete state.mapThread[threadID];
      } else {
        state.mapThread = {};
      }
    },
    actClearWhenStop: (state: IWorkflowRunnerState) => {
      state.mapError = {};
      state.mapMinMaxDuration = {};
      state.mapThread = {};
      state.mapNodeSlots = {};
    },
    actSetIsFullscreen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isFullScreen = action.payload;
    },
    actInitFlowData: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>,
    ) => {
      const { payload } = action;
      if (!state.flowData) {
        state.flowData = initialFlowData;
      }

      state.flowData = {
        present: { nodes: payload?.nodes, edges: payload?.edges },
        past: [],
        future: [],
        undoable: false,
        redoable: false,
      };
    },
    actSetNodes: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ nodes: Node[]; saveHistory: boolean }>,
    ) => {
      const { nodes, saveHistory } = action?.payload;
      if (!state.flowData) {
        state.flowData = initialFlowData;
      }
      const past = current(state.flowData.past);
      const currentPresent = current(state.flowData.present);
      const newPresent = { ...currentPresent, nodes };

      if (!saveHistory) {
        state.flowData = {
          ...state.flowData,
          present: newPresent,
        };
        return;
      }

      state.isSaved = false;
      state.flowData = {
        ...state.flowData,
        present: newPresent,
        past: [...past, currentPresent],
        future: [], // clear the future
        undoable: true,
      };
    },
    actSetEdges: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ edges: Edge[]; saveHistory: boolean }>,
    ) => {
      const { edges, saveHistory } = action?.payload;
      if (!state.flowData) {
        state.flowData = initialFlowData;
      }
      const past = current(state.flowData.past);
      const currentPresent = current(state.flowData.present);
      const newPresent = { ...currentPresent, edges };

      if (!saveHistory) {
        state.flowData = {
          ...state.flowData,
          present: newPresent,
        };
        return;
      }

      state.isSaved = false;
      state.flowData = {
        ...state.flowData,
        present: newPresent,
        past: [...past, currentPresent],
        future: [], // clear the future
        undoable: true,
      };
    },
    actUndo: (state: IWorkflowRunnerState, _action: PayloadAction) => {
      const present = current(state.flowData.present);
      const future = current(state.flowData.future);
      const past = current(state.flowData.past);
      if (past.length === 0) {
        return;
      }

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      state.flowData = {
        ...state.flowData,
        past: newPast,
        present: previous,
        future: [present, ...future],
        undoable: newPast.length > 0,
        redoable: true,
      };
    },
    actRedo: (state: IWorkflowRunnerState, _action: PayloadAction) => {
      const past = current(state.flowData.past);
      const present = current(state.flowData.present);
      const future = current(state.flowData.future);
      if (future.length === 0) {
        return;
      }

      const next = future[0];
      const newFuture = future.slice(1);
      state.flowData = {
        ...state.flowData,
        past: [...past, present],
        present: next,
        future: newFuture,
        undoable: true,
        redoable: newFuture.length > 0,
      };
    },
    actSetShowModalSetting: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalSettingOpen = action?.payload;
    },
    actSetShowModalInstruction: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isShowModalInstruction = action?.payload;
    },
    actSetSelectedWorkflowType: (
      state: IWorkflowRunnerState,
      action: PayloadAction<string | null>,
    ) => {
      state.selectedWorkflowType = action?.payload;
    },
    actSetIsSaved: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isSaved = action?.payload;
    },
    actSetAlertBeforeQuit: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.alertBeforeQuit = action?.payload;
    },
    actSetSampleContractSniperResults: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{
        data: ISnipeContractResult[];
        totalData: number;
      }>,
    ) => {
      state.sampleContractSniperResults = action?.payload?.data;
      state.totalContractSniperResult = action?.payload?.totalData;
      state.contractSniperResultLastUpdate = new Date().getTime();
    },
    actSetModalSampleContractSniperResultOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalSampleContractSniperResultOpen = action?.payload;
    },
    actSetPriceCheckingData: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ data: CacheItem[] }>,
    ) => {
      state.priceCheckingData = action?.payload?.data;
    },
    actSetMarketcapCheckingData: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ data: CacheItem[] }>,
    ) => {
      state.marketcapCheckingData = action?.payload?.data;
    },
    actSetModalPriceCheckingOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalPriceCheckingOpen = action?.payload;
    },
    actSetModalMarketcapCheckingOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalMarketcapCheckingOpen = action?.payload;
    },
    actSetMapExtensionID: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{ [extensionKey: string]: string }>,
    ) => {
      state.mapExtensionID = action.payload;
    },
    actSyncWorkflowData: (
      state: IWorkflowRunnerState,
      action: PayloadAction<IWorkflowRunnerState>,
    ) => {
      state.mapThread = action.payload?.mapThread;
      state.mapError = action.payload?.mapError;
      state.mapMinMaxDuration = action.payload?.mapMinMaxDuration;
      state.mapNodeSlots = action.payload?.mapNodeSlots || {};
      state.isRunning = action.payload?.isRunning;
      state.currentRound = action.payload?.currentRound;
      state.isSleeping = action.payload?.isSleeping;
    },
    actSetCurrentRound: (
      state: IWorkflowRunnerState,
      action: PayloadAction<number>,
    ) => {
      state.currentRound = action.payload;
    },
    actSetIsSleeping: (
      state: IWorkflowRunnerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isSleeping = action.payload;
    },
    actSetListRunningWorkflow: (
      state: IWorkflowRunnerState,
      action: PayloadAction<IRunningWorkflow[]>,
    ) => {
      state.listRunningWorkflow = action.payload;
    },
    actSetModalAnalyzeVariableOpen: (
      state: IWorkflowRunnerState,
      action: PayloadAction<{
        isModalAnalyzeVariableOpen: boolean;
        selectedVariable: IWorkflowVariable | null;
      }>,
    ) => {
      const { isModalAnalyzeVariableOpen, selectedVariable } = action.payload;
      state.isModalAnalyzeVariableOpen = isModalAnalyzeVariableOpen;
      state.selectedVariable = selectedVariable;
    },
  },
});

export const {
  actSetModalOpen,
  actSetModalQueueOpen,
  actSaveSelectedNode,
  actSaveSelectedEdge,
  actCleanThread,
  actSetIsRun,
  actSetModalPreferenceOpen,
  actSetIsFullscreen,
  actInitFlowData,
  actSetNodes,
  actSetEdges,
  actUndo,
  actRedo,
  actSetShowModalInstruction,
  actSetSelectedWorkflowType,
  actSetShowModalSetting,
  actClearWhenStop,
  actSetIsSaved,
  actSetAlertBeforeQuit,
  actSetSampleContractSniperResults,
  actSetModalSampleContractSniperResultOpen,
  actSetPriceCheckingData,
  actSetMarketcapCheckingData,
  actSetModalPriceCheckingOpen,
  actSetModalMarketcapCheckingOpen,
  actSetMapExtensionID,
  actSyncWorkflowData,
  actSetCurrentRound,
  actSetIsSleeping,
  actSetListRunningWorkflow,
  actSetModalAnalyzeVariableOpen,
} = workflowSlice.actions;
export const workflowSelector = (state: RootState) => state.WorkflowRunner;
export default workflowSlice.reducer;
