import { Edge, Node, Connection, Position } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { uid } from "uid";
import { NODE_TYPE } from "@/electron/constant";
import {
  ICampaign,
  IResourceGroup,
  IWorkflowVariable,
  ColumnConfig,
} from "@/electron/type";
import {
  getCampaignAdditionalColumn,
  getResourceColumn,
} from "@/service/tableView";
import { WALLET_VARIABLE, WORKFLOW_TYPE } from "@/electron/constant";

const edgeColorDarkMode = "#e8e8e8";
const edgeColorLightMode = "#212A3E";

// Clean up edges that reference non-existent nodes
export const cleanUpWrongEdge = (edges: Edge[], nodes: Node[]): Edge[] => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
};

const getVariableFromCampaign = (
  campaign: ICampaign | null,
  translate: any,
) => {
  if (campaign === null) {
    return [];
  }

  const listVariable: IWorkflowVariable[] = [
    {
      label: translate("wallet.walletAddress"),
      variable: WALLET_VARIABLE.WALLET_ADDRESS,
    },
    {
      label: "Phrase",
      variable: WALLET_VARIABLE.WALLET_PHRASE,
    },
    {
      label: translate("wallet.privateKey"),
      variable: WALLET_VARIABLE.WALLET_PRIVATE_KEY,
    },
  ];

  const campaignAdditionalColumn = getCampaignAdditionalColumn(campaign);
  campaignAdditionalColumn?.forEach((column: ColumnConfig) => {
    listVariable.push({
      label: column?.title!,
      variable: column?.variable!,
    });
  });

  campaign.profileGroup?.listResourceGroup?.forEach(
    (resourceGroup: IResourceGroup) => {
      const resourceColumn = getResourceColumn(resourceGroup);
      resourceColumn?.forEach((column: ColumnConfig) => {
        listVariable.push({
          label: column?.title!,
          variable: column?.variable!,
        });
      });
    },
  );

  return listVariable;
};

// ignoredIds is list of "loop" node id, can create cycles if cycle contains "loop" node
const hasCycle = (graph: Edge[], ignoredId: string[]): boolean => {
  const ignoredIdSet = new Set(ignoredId);
  const visited = new Set();
  const stack = new Set();

  function isCyclic(node: any) {
    if (stack.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visited.add(node);
    stack.add(node);

    const neighbors = graph
      .filter((edge: any) => edge.source === node)
      .map((edge: any) => edge.target);

    for (const neighbor of neighbors) {
      if (ignoredIdSet.has(neighbor)) {
        continue; // Skip this neighbor with an ignored ID
      }

      if (isCyclic(neighbor)) {
        return true;
      }
    }

    stack.delete(node);
    return false;
  }

  for (const node of graph.map((edge: any) => edge.source)) {
    if (isCyclic(node)) {
      return true;
    }
  }

  return false;
};

//  each node has only one edge, with node connect with "loop" node
//  or "end" node can has two
const getListNodeCanHaveTwoEdges = (
  newEdges: Edge[],
  nodes: Node[],
): string[] => {
  const loopOrEndNodeId = nodes
    ?.filter(
      (node: Node) =>
        node?.type === NODE_TYPE.END_NODE ||
        (node?.data?.config as any)?.workflowType === WORKFLOW_TYPE.LOOP,
    )
    .map((node: Node) => node.id);

  const listNodeCanHaveTwoEdges = newEdges
    .filter((edge: Edge) => loopOrEndNodeId?.includes(edge?.target))
    .map((edge: Edge) => edge.source);

  return listNodeCanHaveTwoEdges;
};

const checkConnectEdge = (
  currentEdges: Edge[],
  newEdge: Edge | Connection,
  listNodeCanHaveTwoEdges: string[],
): boolean => {
  const sourceNewEdge = newEdge?.source || "";
  const newEdgeHandle = newEdge?.sourceHandle || "";

  // branch edges (success/error handles) are always allowed — each handle can have one edge
  if (newEdgeHandle) {
    const existingEdgeFromSameHandle = currentEdges.find(
      (edge: any) =>
        edge?.source === sourceNewEdge && edge?.sourceHandle === newEdgeHandle,
    );
    if (existingEdgeFromSameHandle) {
      return false;
    }
    return true;
  }

  // node just connected edge can has two edges
  const isHasTwoEdge = listNodeCanHaveTwoEdges.includes(sourceNewEdge);
  const countExistSourceEdge = currentEdges.filter(
    (edge: any) => edge.source === sourceNewEdge,
  ).length;

  // if node just connected can have two edge, check the count of it
  if (
    (isHasTwoEdge && countExistSourceEdge >= 2) ||
    (countExistSourceEdge >= 1 && !isHasTwoEdge)
  ) {
    return false;
  }

  return true;
};

const convertCamelCaseToVariable = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2") // Add underscore between camelCase boundaries
    .toUpperCase();
};

export type AlignmentLines = {
  vertical: number | null;
  horizontal: number | null;
};

export enum LayoutDirection {
  HORIZONTAL = "LR",
  VERTICAL = "TB",
}

const parseDimension = (value?: number | string): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const numeric = parseFloat(value);
    return Number.isNaN(numeric) ? undefined : numeric;
  }
  return undefined;
};

const extractDimensionValue = (value: unknown): number | string | undefined => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 80;
const ALIGNMENT_SNAP_DISTANCE = 8;
const BASE_NODE_SEPARATION_X = 80;
const BASE_NODE_SEPARATION_Y = 80;
const EXTRA_HORIZONTAL_GAP = 50;
const EXTRA_VERTICAL_GAP = 0;

const getNodeDimensions = (node: Node) => {
  const style = (node?.style || {}) as Record<string, unknown>;
  const width =
    node?.measured?.width ||
    parseDimension(extractDimensionValue(node?.width || undefined)) ||
    parseDimension(extractDimensionValue(style?.width)) ||
    NODE_WIDTH;
  const height =
    node?.measured?.height ||
    parseDimension(extractDimensionValue(node?.height || undefined)) ||
    parseDimension(extractDimensionValue(style?.height)) ||
    NODE_HEIGHT;

  return { width, height };
};

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection,
) => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === LayoutDirection.HORIZONTAL;
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep:
      BASE_NODE_SEPARATION_Y +
      (isHorizontal ? EXTRA_HORIZONTAL_GAP : EXTRA_VERTICAL_GAP),
    nodesep: BASE_NODE_SEPARATION_X,
    edgesep: BASE_NODE_SEPARATION_Y / 2,
  });

  const dimensionMap = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    const dimensions = getNodeDimensions(node);
    dimensionMap.set(node.id, dimensions);
    dagreGraph.setNode(node.id, dimensions);
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dimensions = dimensionMap.get(node.id) || {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const getDragPosition = (
  nodeId: string,
  nextPosition: { x: number; y: number },
  nodes: Node[],
) => {
  const currentNode = nodes.find((nodeItem) => nodeItem.id === nodeId);
  if (!currentNode) {
    return {
      position: nextPosition,
      guides: { vertical: null, horizontal: null } as AlignmentLines,
    };
  }

  const { width: nodeWidth, height: nodeHeight } =
    getNodeDimensions(currentNode);
  const otherNodes = nodes.filter((nodeItem) => nodeItem.id !== nodeId);

  let snappedX = nextPosition.x;
  let snappedY = nextPosition.y;
  let verticalGuide: number | null = null;
  let horizontalGuide: number | null = null;
  let bestXDiff = ALIGNMENT_SNAP_DISTANCE + 1;
  let bestYDiff = ALIGNMENT_SNAP_DISTANCE + 1;

  const dragLeft = nextPosition.x;
  const dragRight = nextPosition.x + nodeWidth;
  const dragCenterX = nextPosition.x + nodeWidth / 2;
  const dragTop = nextPosition.y;
  const dragBottom = nextPosition.y + nodeHeight;
  const dragCenterY = nextPosition.y + nodeHeight / 2;

  const evaluateX = (diff: number, newX: number, guide: number) => {
    if (diff < bestXDiff && diff <= ALIGNMENT_SNAP_DISTANCE) {
      bestXDiff = diff;
      snappedX = newX;
      verticalGuide = guide;
    }
  };

  const evaluateY = (diff: number, newY: number, guide: number) => {
    if (diff < bestYDiff && diff <= ALIGNMENT_SNAP_DISTANCE) {
      bestYDiff = diff;
      snappedY = newY;
      horizontalGuide = guide;
    }
  };

  otherNodes.forEach((otherNode) => {
    const { width: otherWidth, height: otherHeight } =
      getNodeDimensions(otherNode);

    const otherLeft = otherNode.position.x;
    const otherRight = otherNode.position.x + otherWidth;
    const otherCenterX = otherLeft + otherWidth / 2;
    const otherTop = otherNode.position.y;
    const otherBottom = otherNode.position.y + otherHeight;
    const otherCenterY = otherTop + otherHeight / 2;

    evaluateX(Math.abs(dragLeft - otherLeft), otherLeft, otherLeft);
    evaluateX(
      Math.abs(dragRight - otherRight),
      otherRight - nodeWidth,
      otherRight,
    );
    evaluateX(
      Math.abs(dragCenterX - otherCenterX),
      otherCenterX - nodeWidth / 2,
      otherCenterX,
    );

    evaluateY(Math.abs(dragTop - otherTop), otherTop, otherTop);
    evaluateY(
      Math.abs(dragBottom - otherBottom),
      otherBottom - nodeHeight,
      otherBottom,
    );
    evaluateY(
      Math.abs(dragCenterY - otherCenterY),
      otherCenterY - nodeHeight / 2,
      otherCenterY,
    );
  });

  return {
    position: {
      x: snappedX,
      y: snappedY,
    },
    guides: {
      vertical: bestXDiff <= ALIGNMENT_SNAP_DISTANCE ? verticalGuide : null,
      horizontal: bestYDiff <= ALIGNMENT_SNAP_DISTANCE ? horizontalGuide : null,
    } as AlignmentLines,
  };
};

const getNewNodeId = () => {
  return uid(15);
};

export {
  getVariableFromCampaign,
  edgeColorDarkMode,
  edgeColorLightMode,
  hasCycle,
  getListNodeCanHaveTwoEdges,
  checkConnectEdge,
  convertCamelCaseToVariable,
  getDragPosition,
  getLayoutedElements,
  getNewNodeId,
};
