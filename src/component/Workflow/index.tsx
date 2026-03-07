import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
  ConnectionMode,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  Connection,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  NodePositionChange,
} from "@xyflow/react";
import { connect } from "react-redux";
import { useMenuState } from "@szhsin/react-menu";
import _ from "lodash";
import { message, Tooltip } from "antd";
import { ModalCampaign } from "@/component";
import { RootState } from "@/redux/store";
import { INodeData, IWorkflowData } from "@/types/interface";
import { IPreference, IWorkflow } from "@/electron/type";
import {
  IWorkflowRunnerState,
  actInitFlowData,
  actSetNodes,
  actSetEdges,
  actSaveSelectedNode,
  actSaveSelectedEdge,
  actSetSelectedWorkflowType,
} from "@/redux/workflowRunner";
import { actSetEncryptKey } from "@/redux/campaign";
import { actSetSidebarOpen } from "@/redux/layout";
import {
  EXTENSION,
  EXTENSION_NAME_SEARCH,
  NODE_STATUS,
  NODE_TYPE,
  WORKFLOW_TYPE,
} from "@/electron/constant";
import { EDGE_TYPE } from "@/config/constant";
import { useTranslation, useGetListExtensionByName } from "@/hook";
import { IStatus } from "@/redux/campaignProfile";
import ContextMenu from "./ContextMenu";
import Panel from "./Panel";
import { PageWrapper, StatusWrapper } from "./style";
import CustomNode from "./Node/CustomNode";
import StartNode from "./Node/StartNode";
import CommentNode from "./Node/CommentNode";
import EndNode from "./Node/EndNode";
import FloatingEdge from "./FloatingEdge";
import CustomConnectionLine from "./CustomConnectionLine";
import ModalNodeConfig from "./ModalNodeConfig";
import ModalQueueData from "./ModalQueueData";
import ModalInstruction from "./ModalInstruction";
import ModalContractSniperResult from "./ModalContractSniperResult";
import ModalAnalyzeVariable from "./ModalAnalyzeVariable";
import {
  edgeColorDarkMode,
  edgeColorLightMode,
  hasCycle,
  getListNodeCanHaveTwoEdges,
  checkConnectEdge,
  LayoutDirection,
  AlignmentLines,
  getDragPosition,
  getLayoutedElements,
  getNewNodeId,
  cleanUpWrongEdge,
} from "./util";
import ModalWorkflowSetting from "./ModalWorkflowSetting";
import BeforeQuitHandler from "./BeforeQuitHandler";
import Monitor from "./Monitor";
import ModalTokenPrice from "./ModalTokenPrice";
import ModalMarketcap from "./ModalMarketcap";

let draggingNodeId: string | null = null;
let fitViewTimeout: any = null;
let layoutTimeout: any = null;

const nodeTypes: any = {
  [NODE_TYPE.CUSTOM_NODE]: CustomNode,
  [NODE_TYPE.START_NODE]: StartNode,
  [NODE_TYPE.END_NODE]: EndNode,
  [NODE_TYPE.COMMENT_NODE]: CommentNode,
};

const edgeTypes = {
  [EDGE_TYPE.FLOATING]: FloatingEdge,
};

type IProps = {
  workflowState: IWorkflowRunnerState;
  actSetSidebarOpen: (payload: boolean) => void;
  selectedWorkflow: IWorkflow | null;
  preference: IPreference | null;
  actInitFlowData: (payload: { nodes: Node[]; edges: Edge[] }) => void;
  actSetNodes: (payload: { nodes: Node[]; saveHistory: boolean }) => void;
  actSetEdges: (payload: { edges: Edge[]; saveHistory: boolean }) => void;
  isLightMode: boolean;
  actSaveSelectedNode: (payload: string | null) => void;
  actSaveSelectedEdge: (payload: string | null) => void;
  actSetSelectedWorkflowType: (payload: string | null) => void;
  actSetEncryptKey: (payload: string) => void;
  encryptKey: string;
  status: IStatus;
  currentRound: number;
};

const Workflow = (props: IProps) => {
  const {
    workflowState,
    selectedWorkflow,
    preference,
    isLightMode,
    status,
    currentRound,
    actSetSidebarOpen,
    actInitFlowData,
    actSetNodes,
    actSetEdges,
    actSaveSelectedNode,
    actSaveSelectedEdge,
    actSetSelectedWorkflowType,
    actSetEncryptKey,
  } = props;
  const { translate } = useTranslation();
  const { selectedNodeID, flowData = null } = workflowState;
  const { nodes = [], edges = [] } = flowData?.present || {};

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [menuProps, toggleMenu] = useMenuState();
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const { getListExtensionByName } = useGetListExtensionByName();
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLines>({
    vertical: null,
    horizontal: null,
  });

  const clearAlignmentLines = useCallback(() => {
    setAlignmentLines({ vertical: null, horizontal: null });
  }, []);

  const getSnappedPosition = useCallback(
    (nodeId: string, nextPosition: { x: number; y: number }) => {
      return getDragPosition(nodeId, nextPosition, nodes);
    },
    [nodes],
  );

  const onLayout = useCallback(
    (direction: LayoutDirection) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      // Clean up orphaned edges after layout
      const cleanedEdges = cleanUpWrongEdge(
        layoutedEdges,
        layoutedNodes as Node[],
      );

      actSetNodes({ nodes: layoutedNodes as Node[], saveHistory: true });
      actSetEdges({ edges: cleanedEdges, saveHistory: true });

      clearTimeout(layoutTimeout);
      layoutTimeout = setTimeout(() => {
        reactFlowInstance?.fitView({ maxZoom: 0.95 });
      }, 50);
    },
    [nodes, edges, reactFlowInstance],
  );

  useEffect(() => {
    clearTimeout(fitViewTimeout);
    fitViewTimeout = setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance?.fitView({ maxZoom: 0.95 });
      }
    }, 50);
  }, [reactFlowInstance]);

  useEffect(() => {
    return () => {
      actSaveSelectedNode(null);
      actSaveSelectedEdge(null);
      actSetEncryptKey("");
    };
  }, []);

  const listLoopNodeId = useMemo(() => {
    const listId = nodes
      .filter(
        (node: any) => node?.data?.config?.workflowType === WORKFLOW_TYPE.LOOP,
      )
      .map((loopNode) => loopNode.id);

    return listId;
  }, [nodes]);

  useEffect(() => {
    if (!_.find(nodes, (node: Node) => node.type === NODE_TYPE.START_NODE)) {
      // add default StartNode
      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      const position = reactFlowInstance?.screenToFlowPosition({
        x: (reactFlowBounds?.width || 0) / 2 - 40,
        y: (reactFlowBounds?.height || 0) / 2 - 40,
      }) || { x: 0, y: 0 };

      const newNode: Node = {
        id: getNewNodeId(),
        type: NODE_TYPE.START_NODE,
        data: {},
        position,
      };

      actSetNodes({ nodes: nodes.concat(newNode), saveHistory: false });
    }

    if (!_.find(nodes, (node: Node) => node.type === NODE_TYPE.END_NODE)) {
      // add default StartNode
      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      const position = reactFlowInstance?.screenToFlowPosition({
        x: (reactFlowBounds?.width || 0) / 2 + 40,
        y: (reactFlowBounds?.height || 0) / 2 - 40,
      }) || { x: 0, y: 0 };

      const newNode: Node = {
        id: getNewNodeId(),
        type: NODE_TYPE.END_NODE,
        data: {},
        position,
      };

      actSetNodes({ nodes: nodes.concat(newNode), saveHistory: false });
    }
  }, [nodes, reactFlowInstance]);

  useEffect(() => {
    if (!selectedWorkflow) {
      return;
    }

    const workflowData: IWorkflowData = JSON.parse(
      selectedWorkflow.data || JSON.stringify({ nodes: [], edges: [] }),
    );

    // Clean up orphaned edges before initializing flow data
    const cleanedEdges = cleanUpWrongEdge(
      workflowData?.edges || [],
      workflowData?.nodes || [],
    );

    actInitFlowData({
      nodes: workflowData?.nodes || [],
      edges: cleanedEdges,
    });

    clearTimeout(fitViewTimeout);
    fitViewTimeout = setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance?.fitView({ maxZoom: 0.95 });
      }
    }, 50);
  }, [selectedWorkflow?.id]);

  useEffect(() => {
    actSetSidebarOpen(false);
    actSaveSelectedNode(null);
    actSetSelectedWorkflowType(null);
    actSaveSelectedEdge(null);

    getListExtensionByName([
      EXTENSION_NAME_SEARCH[EXTENSION.METAMASK],
      EXTENSION_NAME_SEARCH[EXTENSION.PHANTOM_WALLET],
      EXTENSION_NAME_SEARCH[EXTENSION.RABBY_WALLET],
      EXTENSION_NAME_SEARCH[EXTENSION.MARTIAN_WALLET],
    ]);

    return () => {
      actInitFlowData({ nodes: [], edges: [] }); // clear state to prevent conflict
    };
  }, []);

  // when connect two node
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const sourceNode: any = _.find(nodes, { id: params?.source });
      const targetNode: any = _.find(nodes, { id: params?.target });
      let isWithQueue = true;

      if (targetNode?.type === NODE_TYPE.START_NODE) {
        return;
      }
      if (sourceNode?.type === NODE_TYPE.START_NODE) {
        isWithQueue = false;
      }

      const newEdges = addEdge(
        { ...params, data: { withQueue: isWithQueue } },
        edges,
      );

      const listNodeCanHaveTwoEdges = getListNodeCanHaveTwoEdges(
        newEdges,
        nodes,
      );
      const isHasCycle = hasCycle(newEdges, listLoopNodeId);
      const isCanConnectEdge = checkConnectEdge(
        edges,
        params,
        listNodeCanHaveTwoEdges,
      );

      if (isHasCycle) {
        message.warning(translate("workflow.invalidLoop"), 4);
      } else if (!isCanConnectEdge) {
        message.warning(translate("workflow.invalidConnectEdge"), 4);
      } else {
        // Clean up orphaned edges after connecting edges
        const cleanedEdges = cleanUpWrongEdge(newEdges, nodes);

        actSetEdges({ edges: cleanedEdges, saveHistory: true });
      }
    },
    [edges, nodes, listLoopNodeId, translate],
  );

  const onNodesDelete = useCallback(
    (deleted: any[]) => {
      const newEdges = deleted.reduce((acc, node: Node) => {
        const incomers = getIncomers(node, nodes, edges);
        const outgoers = getOutgoers(node, nodes, edges);
        const connectedEdgesOfNode = getConnectedEdges([node], edges);

        const remainingEdges = acc.filter(
          (edge: Edge) => !connectedEdgesOfNode.includes(edge),
        );

        const createdEdges = incomers.flatMap(({ id: source }) =>
          outgoers.map(({ id: target }) => ({
            id: `${source}->${target}`,
            source,
            target,
            type: EDGE_TYPE.FLOATING,
            data: { withQueue: true },
          })),
        );

        const newEdges = [...remainingEdges, ...createdEdges];
        return newEdges;
      }, edges);

      const isHasCycle = hasCycle(newEdges, listLoopNodeId);

      if (!isHasCycle) {
        // Clean up orphaned edges after deleting nodes
        const cleanedEdges = cleanUpWrongEdge(newEdges, nodes);
        actSetEdges({ edges: cleanedEdges, saveHistory: true });
      }
      actSaveSelectedNode(null);
    },
    [edges, listLoopNodeId, nodes],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let saveHistory = true;
      let processedChanges = changes;

      const firstChange = changes?.[0];
      const changeType = firstChange?.type;
      switch (changeType) {
        case "select":
          // when select a Node
          saveHistory = false;
          break;
        case "dimensions":
          // when drag drop to create new Node, @onDrop() will handle @saveHistory = true
          saveHistory = false;
          break;
        case "position": {
          // only save initial position of Node before drag
          const positionChange = firstChange as NodePositionChange | undefined;
          if (positionChange?.dragging) {
            saveHistory = draggingNodeId === null;
            draggingNodeId = positionChange.id;

            if (positionChange?.position) {
              const { position, guides } = getSnappedPosition(
                positionChange.id,
                positionChange.position,
              );

              processedChanges = changes.map((change) => {
                if (
                  change.type === "position" &&
                  change.id === positionChange.id
                ) {
                  const updatedChange = {
                    ...change,
                    position,
                  } as NodePositionChange;
                  updatedChange.positionAbsolute = position;
                  return updatedChange;
                }
                return change;
              });

              setAlignmentLines(guides);
            }
          } else {
            draggingNodeId = null;
            saveHistory = false;
            clearAlignmentLines();
          }
          break;
        }
        default:
          break;
      }

      const updatedNodes = applyNodeChanges(processedChanges, nodes);
      actSetNodes({
        nodes: updatedNodes,
        saveHistory,
      });
    },
    [clearAlignmentLines, getSnappedPosition, nodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      let saveHistory = true;

      const firstChange = changes?.[0];
      const changeType = firstChange?.type;
      if (changeType === "select") {
        saveHistory = false;
      } else if (changeType === "remove") {
        actSaveSelectedEdge(null);
      }

      const newEdges = applyEdgeChanges(changes, edges);
      actSetEdges({ edges: newEdges, saveHistory });
    },
    [edges],
  );

  const onOpenContextMenu = (event: React.MouseEvent) => {
    event?.preventDefault();
    setAnchorPoint({ x: event?.clientX, y: event?.clientY });
    toggleMenu(true);
  };

  const onStartStopNode = useCallback(
    (isStart: boolean) => {
      const { selectedNodeID } = workflowState;

      const newNodes = nodes.map((node: Node) => {
        if (selectedNodeID !== null && node?.id !== selectedNodeID) {
          return node;
        }

        let newNode = node;
        const data = node?.data as INodeData;
        const nodeData = {
          ...data,
          config: {
            ...data?.config,
            status: isStart ? NODE_STATUS.RUN : NODE_STATUS.STOP,
          },
        };
        newNode = { ...newNode, data: nodeData };

        return newNode;
      });

      actSetNodes({ nodes: newNodes, saveHistory: true });
    },
    [nodes, workflowState],
  );

  const onDuplicateNode = useCallback(() => {
    if (!selectedNodeID) {
      return;
    }

    const node = _.find(nodes, { id: selectedNodeID });
    const newNode: Node = {
      id: getNewNodeId(),
      type: node?.type,
      data: node?.data || {},
      position: { x: node?.position?.x! + 80, y: node?.position?.y! - 70 },
    };

    actSetNodes({ nodes: nodes.concat(newNode), saveHistory: true });
  }, [nodes, selectedNodeID]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      const data = event.dataTransfer.getData("data");
      const nodeData: INodeData = JSON.parse(data);

      if (!nodeData?.config?.workflowType) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX - (reactFlowBounds?.left || 0),
        y: event.clientY - (reactFlowBounds?.top || 0),
      }) || { x: 0, y: 0 };
      const newNode: Node = {
        id: getNewNodeId(),
        position,
        data: {
          config: nodeData?.config,
          version: nodeData?.version,
        },
        type: nodeData.type,
      };

      actSetNodes({ nodes: nodes.concat(newNode), saveHistory: true });
      actSaveSelectedNode(newNode?.id);
      actSetSelectedWorkflowType(
        (newNode?.data as INodeData)?.config?.workflowType || null,
      );
    },
    [
      actSaveSelectedNode,
      actSetNodes,
      actSetSelectedWorkflowType,
      nodes,
      reactFlowInstance,
    ],
  );

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const edgeColor = useMemo(() => {
    return isLightMode ? edgeColorLightMode : edgeColorDarkMode;
  }, [isLightMode]);

  // change edge color
  const edgesWithColor = useMemo(() => {
    const newEdges = edges?.map((edge: Edge) => {
      const markerEnd: any = edge?.markerEnd || {};
      return {
        ...edge,
        style: { ...edge?.style, color: edgeColor, stroke: edgeColor },
        markerEnd: { ...markerEnd, color: edgeColor },
      };
    });

    return newEdges;
  }, [edgeColor, edges]);

  const progress = useMemo(() => {
    let percentage = 0;
    const { totalProfile = 0, totalUnFinishedProfile = 0 } = status || {};
    if (totalProfile !== 0) {
      const completedProfile = totalProfile - totalUnFinishedProfile;
      percentage = Math.round((completedProfile * 100) / totalProfile);
    }

    return percentage;
  }, [status]);

  const completedProfile = useMemo(() => {
    const { totalProfile = 0, totalUnFinishedProfile = 0 } = status || {};
    return totalProfile - totalUnFinishedProfile;
  }, [status]);

  return (
    <PageWrapper>
      <div
        className="percentage"
        style={{ opacity: progress > 0 || currentRound > 0 ? 1 : 0 }}
      >
        <div className="current" style={{ flexBasis: `${progress}%` }}>
          <Tooltip
            title={
              <StatusWrapper>
                <div className="item">
                  <div className="label">
                    <div
                      className="icon"
                      style={{ backgroundColor: "var(--color-success)" }}
                    />

                    <span>{translate("home.numberProfile")}:</span>
                  </div>
                  <div className="value">
                    {status?.totalProfile || 0} profile
                  </div>
                </div>

                <div className="item">
                  <div className="label">
                    <div
                      className="icon"
                      style={{ backgroundColor: "var(--color-blue)" }}
                    />

                    <span>{translate("workflow.runCompleted")}:</span>
                  </div>
                  <div className="value">{completedProfile} profile</div>
                </div>

                <div className="item">
                  <div className="label">
                    <div
                      className="icon"
                      style={{ backgroundColor: "var(--color-pink)" }}
                    />

                    <span>{translate("workflow.currentRound")}:</span>
                  </div>
                  <div className="value">round {currentRound + 1}</div>
                </div>
              </StatusWrapper>
            }
            placement="left"
          >
            <div
              className="mark"
              style={{
                backgroundColor:
                  progress === 100 ? "var(--green)" : "var(--color-error)",
              }}
            />
          </Tooltip>
        </div>

        <div className="total" style={{ flexBasis: `${100 - progress}%` }} />
      </div>

      <Panel />

      <div
        className="flow"
        onContextMenu={onOpenContextMenu}
        ref={reactFlowWrapper}
      >
        <ReactFlow
          nodes={nodes}
          edges={edgesWithColor}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          edgeTypes={edgeTypes}
          // @ts-ignore
          nodeTypes={nodeTypes}
          maxZoom={20}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: EDGE_TYPE.FLOATING,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeColor,
              strokeWidth: 3,
            },
            style: {
              color: edgeColor,
              stroke: edgeColor,
              strokeWidth: 1,
            },
          }}
          connectionLineStyle={{
            strokeWidth: 2,
            color: "#867ae9",
            stroke: "#867ae9",
          }}
          connectionLineComponent={CustomConnectionLine}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitViewOptions={{
            maxZoom: 1.1,
            minZoom: 1,
          }}
        >
          {!preference?.hideMinimap && (
            <MiniMap
              style={{ backgroundColor: isLightMode ? "#fff" : "#747070" }}
            />
          )}
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={25} />
        </ReactFlow>

        {reactFlowInstance &&
          (alignmentLines.vertical !== null ||
            alignmentLines.horizontal !== null) &&
          (() => {
            const { viewport } = reactFlowInstance.toObject();
            const renderedGuides: JSX.Element[] = [];

            if (alignmentLines.vertical !== null) {
              const left = alignmentLines.vertical * viewport.zoom + viewport.x;
              renderedGuides.push(
                <div
                  key="vertical-guide"
                  className="alignment-guide alignment-guide-vertical"
                  style={{ left: `${left}px` }}
                />,
              );
            }

            if (alignmentLines.horizontal !== null) {
              const top =
                alignmentLines.horizontal * viewport.zoom + viewport.y;
              renderedGuides.push(
                <div
                  key="horizontal-guide"
                  className="alignment-guide alignment-guide-horizontal"
                  style={{ top: `${top}px` }}
                />,
              );
            }

            return renderedGuides.length ? (
              <div className="alignment-guides">{renderedGuides}</div>
            ) : null;
          })()}
      </div>

      <ModalNodeConfig />
      <ModalQueueData />
      <ModalInstruction />
      <ModalWorkflowSetting />
      <ModalContractSniperResult />
      <ModalAnalyzeVariable />
      <ModalTokenPrice />
      <ModalMarketcap />
      <ContextMenu
        menuProps={menuProps}
        anchorPoint={anchorPoint}
        toggleMenu={toggleMenu}
        onStartStopNode={onStartStopNode}
        onDuplicateNode={onDuplicateNode}
        onLayout={onLayout}
      />
      <ModalCampaign isFromWorkflowView={true} />
      <BeforeQuitHandler />
      <Monitor />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    workflowState: state?.WorkflowRunner,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    preference: state?.Preference?.preference,
    isLightMode: state?.Layout?.isLightMode,
    encryptKey: state?.Campaign?.encryptKey,
    status: state?.CampaignProfile?.status,
    currentRound: state?.WorkflowRunner?.currentRound,
  }),
  {
    actSetSidebarOpen,
    actInitFlowData,
    actSetNodes,
    actSetEdges,
    actSaveSelectedNode,
    actSaveSelectedEdge,
    actSetSelectedWorkflowType,
    actSetEncryptKey,
  },
)(Workflow);
