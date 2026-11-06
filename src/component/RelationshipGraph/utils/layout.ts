import { IGraphEdge, IGraphNode, IGraphNodeType } from "@/electron/type";

export type ILayoutNode = IGraphNode & { x: number; y: number; degree: number };

export type ISubClusterMeta = {
  type: IGraphNodeType;
  subIndex: number;
  subCount: number;
};

export type IClusterAssignment = {
  indexByNodeId: Record<string, number | undefined>;
  centerByIndex: [number, number][];
  radiusByIndex: Record<number, number>;
  subClusterMetaByIndex: Record<number, ISubClusterMeta>;
  freeFloatSeedRadius: number;
  aspectStretchX: number;
};

const NODE_RADIUS_ESTIMATE = 26;
const PACKING_EFFICIENCY = 0.72;
const MIN_LEAF_RADIUS = 70;
const CLUSTER_PADDING = 40;

export const DEFAULT_ASPECT_STRETCH_X = 1.6;

const HUB_GAP = 40;
export const HUB_FOOTPRINT_RADIUS = 20;

const leafClusterRadius = (count: number): number =>
  Math.max(
    MIN_LEAF_RADIUS,
    NODE_RADIUS_ESTIMATE * Math.sqrt(count / PACKING_EFFICIENCY),
  );

export const packClustersIntoRows = (
  clusters: { index: number; radius: number }[],
  aspectRatio: number,
): Record<number, [number, number]> => {
  const sorted = [...clusters].sort((a, b) => b.radius - a.radius);
  const totalArea = sorted.reduce(
    (sum, cluster) => sum + Math.PI * cluster.radius * cluster.radius,
    0,
  );
  const targetWidth = Math.sqrt((totalArea * aspectRatio) / 0.35);

  const centerByIndex: Record<number, [number, number]> = {};
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  sorted.forEach((cluster) => {
    const diameter = cluster.radius * 2;
    if (cursorX > 0 && cursorX + diameter > targetWidth) {
      cursorY += rowHeight + CLUSTER_PADDING;
      cursorX = 0;
      rowHeight = 0;
    }
    centerByIndex[cluster.index] = [
      cursorX + cluster.radius,
      cursorY + cluster.radius,
    ];
    cursorX += diameter + CLUSTER_PADDING;
    rowHeight = Math.max(rowHeight, diameter);
  });

  return centerByIndex;
};

const DEFAULT_SEED_JITTER_RADIUS = 40;

export const buildClusterAssignment = (
  nodes: IGraphNode[],
  edges: IGraphEdge[],
  aspectStretchX: number,
): IClusterAssignment => {
  const indexByNodeId: Record<string, number | undefined> = {};

  const walletGroupIdByWalletId: Record<string, string> = {};
  const agentIdByTaskId: Record<string, string> = {};
  edges.forEach((edge) => {
    if (edge.type === "MEMBER_OF") {
      walletGroupIdByWalletId[edge.source] = edge.target;
    }
    if (edge.type === "EXECUTES_TASK") {
      agentIdByTaskId[edge.target] = edge.source;
    }
  });

  const walletGroupIdsInUse = Array.from(
    new Set(Object.values(walletGroupIdByWalletId)),
  );
  const agentIdsInUse = Array.from(new Set(Object.values(agentIdByTaskId)));

  const subClusterIndexByKey: Record<string, number> = {};
  const subClusterMetaByIndex: Record<number, ISubClusterMeta> = {};
  let nextClusterIndex = 0;

  walletGroupIdsInUse.forEach((walletGroupId, subIndex) => {
    const index = nextClusterIndex;
    nextClusterIndex += 1;
    subClusterIndexByKey[`WALLET_GROUP:${walletGroupId}`] = index;
    subClusterMetaByIndex[index] = {
      type: "WALLET",
      subIndex,
      subCount: walletGroupIdsInUse.length,
    };
  });

  agentIdsInUse.forEach((agentId, subIndex) => {
    const index = nextClusterIndex;
    nextClusterIndex += 1;
    subClusterIndexByKey[`AGENT:${agentId}`] = index;
    subClusterMetaByIndex[index] = {
      type: "AGENT_TASK",
      subIndex,
      subCount: agentIdsInUse.length,
    };
  });

  const hubClusterIndexByGroupId: Record<string, number> = {};
  walletGroupIdsInUse.forEach((walletGroupId) => {
    const hubIndex = nextClusterIndex;
    nextClusterIndex += 1;
    hubClusterIndexByGroupId[walletGroupId] = hubIndex;
    const memberMeta =
      subClusterMetaByIndex[
        subClusterIndexByKey[`WALLET_GROUP:${walletGroupId}`]
      ];
    subClusterMetaByIndex[hubIndex] = { ...memberMeta, type: "WALLET_GROUP" };
  });
  const hubClusterIndexByAgentId: Record<string, number> = {};

  agentIdsInUse.forEach((agentId) => {
    const hubIndex = nextClusterIndex;
    nextClusterIndex += 1;
    hubClusterIndexByAgentId[agentId] = hubIndex;
    const memberMeta =
      subClusterMetaByIndex[subClusterIndexByKey[`AGENT:${agentId}`]];
    subClusterMetaByIndex[hubIndex] = { ...memberMeta, type: "AGENT" };
  });

  nodes.forEach((node) => {
    if (node.type === "WALLET") {
      const walletGroupId = walletGroupIdByWalletId[node.id];
      if (walletGroupId) {
        indexByNodeId[node.id] =
          subClusterIndexByKey[`WALLET_GROUP:${walletGroupId}`];
      }
      return;
    }

    if (node.type === "AGENT_TASK") {
      const agentId = agentIdByTaskId[node.id];
      if (agentId) {
        indexByNodeId[node.id] = subClusterIndexByKey[`AGENT:${agentId}`];
      }
      return;
    }

    if (node.type === "WALLET_GROUP") {
      const hubIndex = hubClusterIndexByGroupId[node.id];
      if (hubIndex !== undefined) {
        indexByNodeId[node.id] = hubIndex;
      }
      return;
    }

    if (node.type === "AGENT") {
      const hubIndex = hubClusterIndexByAgentId[node.id];
      if (hubIndex !== undefined) {
        indexByNodeId[node.id] = hubIndex;
      }
      return;
    }
  });

  const memberClusterIndices = new Set(Object.values(subClusterIndexByKey));
  const countByIndex: Record<number, number> = {};
  Object.values(indexByNodeId).forEach((index) => {
    if (index === undefined || !memberClusterIndices.has(index)) {
      return;
    }
    countByIndex[index] = (countByIndex[index] || 0) + 1;
  });

  const radiusByIndex: Record<number, number> = {};
  const packInput: { index: number; radius: number }[] = [];
  Object.keys(countByIndex).forEach((key) => {
    const index = Number(key);
    const visualRadius = leafClusterRadius(countByIndex[index]);
    radiusByIndex[index] = visualRadius;
    packInput.push({
      index,
      radius: visualRadius + HUB_FOOTPRINT_RADIUS + HUB_GAP,
    });
  });

  const packedCenterByIndex = packClustersIntoRows(packInput, aspectStretchX);
  const centerByIndex: [number, number][] = [];
  for (let index = 0; index < nextClusterIndex; index += 1) {
    centerByIndex[index] = packedCenterByIndex[index] || [0, 0];
  }

  walletGroupIdsInUse.forEach((walletGroupId) => {
    const memberIndex = subClusterIndexByKey[`WALLET_GROUP:${walletGroupId}`];
    const hubIndex = hubClusterIndexByGroupId[walletGroupId];
    const [memberX, memberY] = centerByIndex[memberIndex] || [0, 0];
    const memberRadius = radiusByIndex[memberIndex] || MIN_LEAF_RADIUS;
    centerByIndex[hubIndex] = [memberX + memberRadius + HUB_GAP, memberY];
  });
  agentIdsInUse.forEach((agentId) => {
    const memberIndex = subClusterIndexByKey[`AGENT:${agentId}`];
    const hubIndex = hubClusterIndexByAgentId[agentId];
    const [memberX, memberY] = centerByIndex[memberIndex] || [0, 0];
    const memberRadius = radiusByIndex[memberIndex] || MIN_LEAF_RADIUS;
    centerByIndex[hubIndex] = [memberX + memberRadius + HUB_GAP, memberY];
  });

  const measureBounds = () => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let index = 0; index < nextClusterIndex; index += 1) {
      const entry = centerByIndex[index];
      if (!entry) {
        continue;
      }
      const [x, y] = entry;
      const radius = radiusByIndex[index] || HUB_FOOTPRINT_RADIUS;
      minX = Math.min(minX, x - radius);
      maxX = Math.max(maxX, x + radius);
      minY = Math.min(minY, y - radius);
      maxY = Math.max(maxY, y + radius);
    }
    return { minX, maxX, minY, maxY };
  };

  const prelimBounds = measureBounds();
  if (Number.isFinite(prelimBounds.minX)) {
    const actualWidth = prelimBounds.maxX - prelimBounds.minX;
    const actualHeight = prelimBounds.maxY - prelimBounds.minY;

    if (actualHeight > 0 && actualWidth / actualHeight < aspectStretchX) {
      const widthStretchFactor = (actualHeight * aspectStretchX) / actualWidth;
      for (let index = 0; index < nextClusterIndex; index += 1) {
        if (centerByIndex[index]) {
          centerByIndex[index] = [
            centerByIndex[index][0] * widthStretchFactor,
            centerByIndex[index][1],
          ];
        }
      }
    }
  }

  const { minX, maxX, minY, maxY } = measureBounds();
  let freeFloatSeedRadius = DEFAULT_SEED_JITTER_RADIUS;

  if (Number.isFinite(minX)) {
    const boundsCenterX = (minX + maxX) / 2;
    const boundsCenterY = (minY + maxY) / 2;
    for (let index = 0; index < nextClusterIndex; index += 1) {
      if (centerByIndex[index]) {
        centerByIndex[index] = [
          centerByIndex[index][0] - boundsCenterX,
          centerByIndex[index][1] - boundsCenterY,
        ];
      }
    }
    freeFloatSeedRadius = Math.max(maxX - minX, maxY - minY) / 2;
  }

  return {
    indexByNodeId,
    centerByIndex,
    radiusByIndex,
    subClusterMetaByIndex,
    freeFloatSeedRadius,
    aspectStretchX,
  };
};

const pushOutsideCircles = (
  x: number,
  y: number,
  circles: { x: number; y: number; radius: number }[],
): [number, number] => {
  let px = x;
  let py = y;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const blocking = circles.find((circle) => {
      const dx = px - circle.x;
      const dy = py - circle.y;
      return dx * dx + dy * dy < circle.radius * circle.radius;
    });
    if (!blocking) {
      break;
    }
    const dx = px - blocking.x;
    const dy = py - blocking.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle =
      distance > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
    px = blocking.x + Math.cos(angle) * (blocking.radius + 20);
    py = blocking.y + Math.sin(angle) * (blocking.radius + 20);
  }

  return [px, py];
};

export const buildLayout = (
  nodes: IGraphNode[],
  edges: IGraphEdge[],
  clusterAssignment: IClusterAssignment,
): ILayoutNode[] => {
  const degreeByNodeId: Record<string, number> = {};
  edges.forEach((edge) => {
    degreeByNodeId[edge.source] = (degreeByNodeId[edge.source] || 0) + 1;
    degreeByNodeId[edge.target] = (degreeByNodeId[edge.target] || 0) + 1;
  });

  const occupiedCircles = Object.keys(clusterAssignment.radiusByIndex).map(
    (key) => {
      const index = Number(key);
      const [x, y] = clusterAssignment.centerByIndex[index] || [0, 0];
      return { x, y, radius: clusterAssignment.radiusByIndex[index] };
    },
  );

  return nodes.map((node) => {
    const clusterIndex = clusterAssignment.indexByNodeId[node.id];
    const [centerX, centerY] = (clusterIndex !== undefined &&
      clusterAssignment.centerByIndex[clusterIndex]) || [0, 0];
    const clusterRadius =
      clusterIndex !== undefined
        ? clusterAssignment.radiusByIndex[clusterIndex]
        : undefined;
    const seedJitterRadius =
      clusterRadius !== undefined
        ? clusterRadius * 0.7
        : clusterAssignment.freeFloatSeedRadius;
    const jitterAngle = Math.random() * Math.PI * 2;
    const jitterDistance = Math.random() * seedJitterRadius;
    const jitterAspectStretchX =
      clusterIndex === undefined ? clusterAssignment.aspectStretchX : 1;
    let x =
      centerX + Math.cos(jitterAngle) * jitterDistance * jitterAspectStretchX;
    let y = centerY + Math.sin(jitterAngle) * jitterDistance;
    if (clusterIndex === undefined) {
      [x, y] = pushOutsideCircles(x, y, occupiedCircles);
    }

    return {
      ...node,
      x,
      y,
      degree: degreeByNodeId[node.id] || 0,
    };
  });
};

export const neighborIdsOf = (
  nodeId: string,
  edges: IGraphEdge[],
): string[] => {
  const neighborIds: string[] = [];
  edges.forEach((edge) => {
    if (edge.source === nodeId) {
      neighborIds.push(edge.target);
    }
    if (edge.target === nodeId) {
      neighborIds.push(edge.source);
    }
  });
  return neighborIds;
};

export const expandFocusIds = (
  nodeId: string,
  nodes: IGraphNode[],
  edges: IGraphEdge[],
): Set<string> => {
  const typeById = new Map(nodes.map((node) => [node.id, node.type]));
  const focusIds = new Set([nodeId, ...neighborIdsOf(nodeId, edges)]);
  const walletGroupIdsInFocus = Array.from(focusIds).filter(
    (id) => typeById.get(id) === "WALLET_GROUP",
  );

  if (walletGroupIdsInFocus.length > 0) {
    const walletGroupIdSet = new Set(walletGroupIdsInFocus);
    edges.forEach((edge) => {
      if (edge.type === "MEMBER_OF" && walletGroupIdSet.has(edge.target)) {
        focusIds.add(edge.source);
      }
    });
  }
  return focusIds;
};
