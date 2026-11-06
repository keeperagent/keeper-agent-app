import { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Spin } from "antd";
import { connect } from "react-redux";
import { Graph } from "@cosmos.gl/graph";
import { RootState } from "@/redux/store";
import {
  useGetCacheEncryptKey,
  useGetRelationshipGraph,
  useSetCacheEncryptKey,
  useTranslation,
} from "@/hook";
import { IGraphNode, IGraphNodeType } from "@/electron/type";
import { MESSAGE } from "@/electron/constant";
import { PasswordInput, SearchInput } from "@/component/Input";
import { CATEGORY_LIST } from "./constant";
import { Wrapper } from "./style";
import DetailPanel from "./DetailPanel";
import {
  SUB_CLUSTER_HUE_STEP,
  fadeTowardClusterEdge,
  hexToHsl,
  hexToRgba,
  hslToHex,
} from "./utils/color";
import {
  DEFAULT_ASPECT_STRETCH_X,
  HUB_FOOTPRINT_RADIUS,
  IClusterAssignment,
  ILayoutNode,
  buildClusterAssignment,
  buildLayout,
  expandFocusIds,
  neighborIdsOf,
} from "./utils/layout";
import { displayLabel } from "./utils/graphNode";

type IProps = { isLightMode: boolean };

// Reuses campaignId 0, the same fallback campaign-scoped screens use when
// none is selected, so a key typed there is already picked up here for free.
const ENCRYPT_KEY_CACHE_ID = 0;

const RelationshipGraph = ({ isLightMode }: IProps) => {
  const { translate } = useTranslation();
  const { relationshipGraph, loading, getRelationshipGraph } =
    useGetRelationshipGraph();
  const {
    getCacheEncryptKey,
    hasEncryptKey,
    cachedEncryptKey,
    loading: isGetCacheEncryptKeyLoading,
  } = useGetCacheEncryptKey();
  const { setCacheEncryptKey } = useSetCacheEncryptKey();
  const [encryptKeyInputValue, setEncryptKeyInputValue] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    CATEGORY_LIST.forEach((category) => {
      initial[category.type] = true;
    });
    return initial;
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const labelLayerRef = useRef<HTMLDivElement | null>(null);
  const labelElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const graphRef = useRef<Graph | null>(null);
  const layoutNodesRef = useRef<ILayoutNode[]>([]);
  const clusterAssignmentRef = useRef<IClusterAssignment | null>(null);
  const categoryIndicesRef = useRef<Record<string, number[]>>({});
  const baseColorsRef = useRef<Float32Array | null>(null);
  const pulseTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const settleIntervalIdRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const lastUserCameraInteractionAtRef = useRef(0);
  const USER_CAMERA_RECENCY_MS = 1500;
  const isUserRecentlyInControlOfCamera = () =>
    Date.now() - lastUserCameraInteractionAtRef.current <
    USER_CAMERA_RECENCY_MS;
  const userHasTakenCameraControlRef = useRef(false);

  const latestRef = useRef({
    setSelectedNodeId,
    selectedNodeId,
    setHoveredNodeId,
  });
  latestRef.current.setSelectedNodeId = setSelectedNodeId;
  latestRef.current.selectedNodeId = selectedNodeId;
  latestRef.current.setHoveredNodeId = setHoveredNodeId;

  useEffect(() => {
    getCacheEncryptKey(ENCRYPT_KEY_CACHE_ID);
  }, []);

  useEffect(() => {
    if (isGetCacheEncryptKeyLoading) {
      return;
    }
    setEncryptKeyInputValue(hasEncryptKey ? "•" : "");
    getRelationshipGraph(
      hasEncryptKey ? { encryptKey: cachedEncryptKey } : undefined,
    );
  }, [isGetCacheEncryptKeyLoading, hasEncryptKey, cachedEncryptKey]);

  const onChangeEncryptKey = (value: string) => {
    setEncryptKeyInputValue(value);
    setCacheEncryptKey(ENCRYPT_KEY_CACHE_ID, value);
    getRelationshipGraph(value ? { encryptKey: value } : undefined);
  };

  const nodes = relationshipGraph?.nodes || [];
  const edges = relationshipGraph?.edges || [];

  const nodesById = useMemo(() => {
    const lookup: Record<string, IGraphNode> = {};
    nodes.forEach((node) => {
      lookup[node.id] = node;
    });
    return lookup;
  }, [nodes]);

  const categoryColor = (type: IGraphNodeType): string => {
    const category = CATEGORY_LIST.find((item) => item.type === type);
    if (!category) {
      return isLightMode ? "#888888" : "#aaaaaa";
    }
    return isLightMode ? category.colorLight : category.colorDark;
  };

  const MULTI_HUE_CATEGORY_TYPES = new Set<IGraphNodeType>([
    "WALLET",
    "WALLET_GROUP",
    "AGENT",
    "AGENT_TASK",
  ]);

  const legendSwatchBackground = (type: IGraphNodeType): string => {
    const base = categoryColor(type);
    if (!MULTI_HUE_CATEGORY_TYPES.has(type)) {
      return base;
    }
    const [hue, saturation, lightness] = hexToHsl(base);
    const stops = [0, 1, 2].map((subIndex) =>
      hslToHex(hue + subIndex * SUB_CLUSTER_HUE_STEP, saturation, lightness),
    );
    return `linear-gradient(135deg, ${stops.join(", ")})`;
  };

  const clusterColor = (
    clusterIndex: number,
    clusterAssignment: IClusterAssignment,
  ): string => {
    const subClusterMeta =
      clusterAssignment.subClusterMetaByIndex[clusterIndex];
    if (!subClusterMeta) {
      return isLightMode ? "#888888" : "#aaaaaa";
    }
    const [baseHue, saturation, lightness] = hexToHsl(
      categoryColor(subClusterMeta.type),
    );
    const hue = baseHue + subClusterMeta.subIndex * SUB_CLUSTER_HUE_STEP;
    return hslToHex(hue, saturation, lightness);
  };

  const nodeDisplayColor = (node: IGraphNode): string => {
    const clusterAssignment = clusterAssignmentRef.current;
    const clusterIndex = clusterAssignment?.indexByNodeId[node.id];
    if (clusterAssignment && clusterIndex !== undefined) {
      return clusterColor(clusterIndex, clusterAssignment);
    }
    return categoryColor(node.type);
  };

  const onToggleCategory = (type: string) => {
    setActiveCategories((previous) => ({
      ...previous,
      [type]: !previous[type],
    }));
  };

  const onIsolateCategory = (type: string) => {
    const next: Record<string, boolean> = {};
    CATEGORY_LIST.forEach((category) => {
      next[category.type] = category.type === type;
    });
    setActiveCategories(next);
  };

  const onShowAllCategories = () => {
    const next: Record<string, boolean> = {};
    CATEGORY_LIST.forEach((category) => {
      next[category.type] = true;
    });
    setActiveCategories(next);
  };

  const onZoomToCategory = (type: string) => {
    const graph = graphRef.current;
    const indices = categoryIndicesRef.current[type];
    if (!graph || !indices || indices.length === 0) {
      return;
    }
    lastUserCameraInteractionAtRef.current = Date.now();
    graph.fitViewByPointIndices(indices, 700, 0.2);
  };

  const onZoomIn = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    lastUserCameraInteractionAtRef.current = Date.now();
    graph.setZoomLevel(graph.getZoomLevel() * 1.4, 250);
  };

  const onZoomOut = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    lastUserCameraInteractionAtRef.current = Date.now();
    graph.setZoomLevel(graph.getZoomLevel() / 1.4, 250);
  };

  const onFitView = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    lastUserCameraInteractionAtRef.current = Date.now();
    graph.fitView(500, 0.08);
  };

  const syncLabelPositions = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    const positionsByIndex = graph.getTrackedPointPositionsMap({
      nonBlocking: true,
    });

    const candidates: {
      node: ILayoutNode;
      screenX: number;
      screenY: number;
    }[] = [];
    layoutNodesRef.current.forEach((node, index) => {
      const labelElement = labelElementRefs.current[node.id];
      if (!labelElement) {
        return;
      }
      const spacePosition = positionsByIndex.get(index);
      if (!spacePosition) {
        labelElement.style.display = "none";
        return;
      }
      const [screenX, screenY] = graph.spaceToScreenPosition(spacePosition);
      if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) {
        labelElement.style.display = "none";
        return;
      }
      candidates.push({ node, screenX, screenY });
    });

    candidates.sort((nodeA, nodeB) => {
      if (nodeA.node.id === latestRef.current.selectedNodeId) {
        return -1;
      }
      if (nodeB.node.id === latestRef.current.selectedNodeId) {
        return 1;
      }
      return nodeB.node.degree - nodeA.node.degree;
    });

    const labelGap = 4;
    const placedRects: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];

    candidates.forEach(({ node, screenX, screenY }) => {
      const labelElement = labelElementRefs.current[node.id];
      if (!labelElement) {
        return;
      }

      const labelText = displayLabel(node);
      const estimatedWidth = labelText.length * 6.6 + 14;
      const estimatedHeight = 18;
      const left = screenX + 10;
      const top = screenY - 6;
      const rect = {
        left,
        top,
        right: left + estimatedWidth,
        bottom: top + estimatedHeight,
      };

      const overlapsPlacedLabel = placedRects.some(
        (placedRect) =>
          rect.left < placedRect.right + labelGap &&
          rect.right + labelGap > placedRect.left &&
          rect.top < placedRect.bottom + labelGap &&
          rect.bottom + labelGap > placedRect.top,
      );

      if (overlapsPlacedLabel) {
        labelElement.style.display = "none";
        return;
      }

      placedRects.push(rect);
      labelElement.style.display = "";
      labelElement.style.transform = `translate(${screenX}px, ${screenY}px)`;
    });
  };

  // Construct the Graph once; data/colors/clusters are pushed in imperatively
  // by the effects below — the instance is never torn down except on unmount.
  useEffect(() => {
    if (!canvasContainerRef.current) {
      return () => {};
    }

    const graph = new Graph(canvasContainerRef.current, {
      backgroundColor: "transparent",
      pointDefaultSize: 14,
      enableDrag: true,
      enableZoom: true,
      renderHoveredPointRing: true,
      scalePointsOnZoom: true,
      fitViewOnInit: false,
      fitViewPadding: 0.08,
      curvedLinks: true,
      linkColorInterpolateFromEndpoints: true,
      linkDefaultColor: isLightMode ? "#999999" : "#383838",
      linkOpacity: 0.85,
      linkGreyoutOpacity: isLightMode ? 0.7 : 0.3,
      pointGreyoutOpacity: 0.08,
      simulationFriction: 0.9,
      simulationGravity: 0.05,
      simulationRepulsion: 1.4,
      simulationCollision: 0.8,
      simulationCollisionPadding: 7,
      simulationCluster: 0.8,
      simulationLinkSpring: 0.5,
      onPointClick: (index) => {
        const node = layoutNodesRef.current[index];
        if (node) {
          latestRef.current.setSelectedNodeId(node.id);
        }
      },
      onBackgroundClick: () => {
        latestRef.current.setSelectedNodeId(null);
      },
      onPointMouseOver: (index) => {
        const node = layoutNodesRef.current[index];
        if (node) {
          latestRef.current.setHoveredNodeId(node.id);
        }
      },
      onPointMouseOut: () => {
        latestRef.current.setHoveredNodeId(null);
      },
      onSimulationTick: syncLabelPositions,
      onZoom: (_event, userDriven) => {
        if (userDriven) {
          lastUserCameraInteractionAtRef.current = Date.now();
          userHasTakenCameraControlRef.current = true;
          if (settleIntervalIdRef.current) {
            clearInterval(settleIntervalIdRef.current);
            settleIntervalIdRef.current = null;
          }
        }
        syncLabelPositions();
      },
      onDrag: () => {
        lastUserCameraInteractionAtRef.current = Date.now();
        userHasTakenCameraControlRef.current = true;
        if (settleIntervalIdRef.current) {
          clearInterval(settleIntervalIdRef.current);
          settleIntervalIdRef.current = null;
        }
        syncLabelPositions();
      },
      onSimulationEnd: () => {
        if (!userHasTakenCameraControlRef.current) {
          graphRef.current?.fitView(500, 0.08);
        }
        if (settleIntervalIdRef.current) {
          clearInterval(settleIntervalIdRef.current);
          settleIntervalIdRef.current = null;
        }
      },
    });
    graphRef.current = graph;

    const onWindowResize = () => syncLabelPositions();
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      graph.destroy();
      graphRef.current = null;
    };
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || nodes.length === 0) {
      return;
    }

    const MIN_ASPECT_STRETCH_X = 2.2;
    const containerAspectRatio = Math.max(
      MIN_ASPECT_STRETCH_X,
      canvasContainerRef.current && canvasContainerRef.current.clientHeight > 0
        ? canvasContainerRef.current.clientWidth /
            canvasContainerRef.current.clientHeight
        : DEFAULT_ASPECT_STRETCH_X,
    );

    const clusterAssignment = buildClusterAssignment(
      nodes,
      edges,
      containerAspectRatio,
    );
    const layoutNodes = buildLayout(nodes, edges, clusterAssignment);
    layoutNodesRef.current = layoutNodes;
    clusterAssignmentRef.current = clusterAssignment;

    const pointIndexById: Record<string, number> = {};
    layoutNodes.forEach((node, index) => {
      pointIndexById[node.id] = index;
    });

    const positions = new Float32Array(layoutNodes.length * 2);
    const colors = new Float32Array(layoutNodes.length * 4);
    const sizes = new Float32Array(layoutNodes.length);
    const clusters: (number | undefined)[] = [];
    const categoryIndices: Record<string, number[]> = {};

    layoutNodes.forEach((node, index) => {
      positions[index * 2] = node.x;
      positions[index * 2 + 1] = node.y;

      const nodeClusterIndex = clusterAssignment.indexByNodeId[node.id];
      let clusterDistanceRatio = 0;
      if (nodeClusterIndex !== undefined) {
        const clusterRadius = clusterAssignment.radiusByIndex[nodeClusterIndex];
        if (clusterRadius) {
          const [centerX, centerY] = clusterAssignment.centerByIndex[
            nodeClusterIndex
          ] || [node.x, node.y];
          clusterDistanceRatio =
            Math.hypot(node.x - centerX, node.y - centerY) / clusterRadius;
        }
      }
      const baseColorHex =
        nodeClusterIndex !== undefined
          ? clusterColor(nodeClusterIndex, clusterAssignment)
          : categoryColor(node.type);
      const [red, green, blue, alpha] = hexToRgba(
        fadeTowardClusterEdge(baseColorHex, clusterDistanceRatio),
        0.9,
      );
      colors[index * 4] = red;
      colors[index * 4 + 1] = green;
      colors[index * 4 + 2] = blue;
      colors[index * 4 + 3] = alpha;

      sizes[index] = 3 + Math.min(node.degree, 10) * 0.8;
      clusters.push(nodeClusterIndex);

      if (!categoryIndices[node.type]) {
        categoryIndices[node.type] = [];
      }
      categoryIndices[node.type].push(index);
    });
    categoryIndicesRef.current = categoryIndices;

    const clusterPositions: (number | undefined)[] = [];
    clusterAssignment.centerByIndex.forEach(([centerX, centerY]) => {
      clusterPositions.push(centerX, centerY);
    });

    const MIN_DEGREE_FOR_FULL_DIM = 20;
    const MIN_LINK_ALPHA_SCALE = 0.35;
    const degreeByNodeId: Record<string, number> = {};
    layoutNodes.forEach((node) => {
      degreeByNodeId[node.id] = node.degree;
    });

    const linkPairs: number[] = [];
    const linkColorValues: number[] = [];
    edges.forEach((edge) => {
      const sourceIndex = pointIndexById[edge.source];
      const targetIndex = pointIndexById[edge.target];
      if (sourceIndex === undefined || targetIndex === undefined) {
        return;
      }
      linkPairs.push(sourceIndex, targetIndex);

      const maxDegree = Math.max(
        degreeByNodeId[edge.source] || 0,
        degreeByNodeId[edge.target] || 0,
      );
      const dimAmount = Math.min(1, maxDegree / MIN_DEGREE_FOR_FULL_DIM);
      const alphaScale = 1 - dimAmount * (1 - MIN_LINK_ALPHA_SCALE);
      linkColorValues.push(1, 1, 1, alphaScale);
    });

    baseColorsRef.current = colors;

    graph.setPointPositions(positions);
    graph.setPointColors(colors);
    graph.setPointSizes(sizes);
    graph.setPointClusters(clusters);
    graph.setClusterPositions(clusterPositions);
    graph.setLinks(new Float32Array(linkPairs));
    graph.setLinkColors(new Float32Array(linkColorValues));
    graph.render();
    graph.trackPointPositionsByIndices(layoutNodes.map((_, index) => index));
    syncLabelPositions();

    lastUserCameraInteractionAtRef.current = 0;
    userHasTakenCameraControlRef.current = false;
    graph.fitView(300, 0.1);

    let hasAppliedFreeNodeDriftCorrection = false;
    const MAX_FREE_NODE_DRIFT_MULTIPLIER = 1.4;

    const settleStartedAt = Date.now();
    settleIntervalIdRef.current = setInterval(() => {
      if (Date.now() - settleStartedAt > 90000) {
        if (settleIntervalIdRef.current) {
          clearInterval(settleIntervalIdRef.current);
          settleIntervalIdRef.current = null;
        }
        return;
      }
      if (isUserRecentlyInControlOfCamera()) {
        return;
      }
      graphRef.current?.fitView(300, 0.1);

      const fitZoomLevel = graphRef.current?.getZoomLevel();
      if (fitZoomLevel) {
        const calibratedSizes = new Float32Array(sizes.length);
        for (let index = 0; index < sizes.length; index += 1) {
          calibratedSizes[index] = sizes[index] / fitZoomLevel;
        }
        graphRef.current?.setPointSizes(calibratedSizes);
        graphRef.current?.render(undefined, 0);
      }

      if (
        !hasAppliedFreeNodeDriftCorrection &&
        graphRef.current &&
        !graphRef.current.isSimulationRunning
      ) {
        hasAppliedFreeNodeDriftCorrection = true;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        clusterAssignment.centerByIndex.forEach(
          ([centerX, centerY], clusterIndex) => {
            const radius =
              clusterAssignment.radiusByIndex[clusterIndex] ||
              HUB_FOOTPRINT_RADIUS;
            minX = Math.min(minX, centerX - radius);
            maxX = Math.max(maxX, centerX + radius);
            minY = Math.min(minY, centerY - radius);
            maxY = Math.max(maxY, centerY + radius);
          },
        );

        if (
          Number.isFinite(minX) &&
          Number.isFinite(maxX) &&
          Number.isFinite(minY) &&
          Number.isFinite(maxY)
        ) {
          const mainMassCenterX = (minX + maxX) / 2;
          const mainMassCenterY = (minY + maxY) / 2;
          const mainMassRadius = Math.max(maxX - minX, maxY - minY) / 2;
          const maxDriftRadius =
            mainMassRadius * MAX_FREE_NODE_DRIFT_MULTIPLIER;

          const positionsByIndex = graphRef.current.getTrackedPointPositionsMap(
            { nonBlocking: false },
          );
          const correctedIndices: number[] = [];
          const correctedPositions: number[] = [];

          layoutNodes.forEach((node, index) => {
            if (clusterAssignment.indexByNodeId[node.id] !== undefined) {
              return;
            }
            const livePosition = positionsByIndex.get(index);
            const [x, y] = livePosition || [node.x, node.y];
            const dx = x - mainMassCenterX;
            const dy = y - mainMassCenterY;
            const distance = Math.hypot(dx, dy);
            if (distance <= maxDriftRadius || distance === 0) {
              return;
            }
            const scale = maxDriftRadius / distance;
            correctedIndices.push(index);
            correctedPositions.push(
              mainMassCenterX + dx * scale,
              mainMassCenterY + dy * scale,
            );
          });

          if (correctedIndices.length > 0) {
            graphRef.current.setPointPositionsByIndices(
              correctedIndices,
              correctedPositions,
            );
            graphRef.current.setPinnedPoints(correctedIndices);
            graphRef.current.render(undefined, 0);
            if (!isUserRecentlyInControlOfCamera()) {
              graphRef.current.fitView(300, 0.1);
            }
          }
        }
      }
    }, 350);

    return () => {
      if (settleIntervalIdRef.current) {
        clearInterval(settleIntervalIdRef.current);
        settleIntervalIdRef.current = null;
      }
    };
  }, [nodes, edges, isLightMode]);

  useEffect(() => {
    const PULSE_FLASH_RGBA: [number, number, number, number] = [1, 1, 1, 1];
    const PULSE_FLASH_MS = 200;
    const PULSE_FADE_MS = 900;

    const pulseNodes = (graphNodeIds: string[]) => {
      const graph = graphRef.current;
      const baseColors = baseColorsRef.current;
      if (!graph || !baseColors) {
        return;
      }
      const indices = graphNodeIds
        .map((id) => layoutNodesRef.current.findIndex((node) => node.id === id))
        .filter((index) => index !== -1);
      if (indices.length === 0) {
        return;
      }

      const flashColors = new Float32Array(baseColors);
      indices.forEach((index) => {
        flashColors[index * 4] = PULSE_FLASH_RGBA[0];
        flashColors[index * 4 + 1] = PULSE_FLASH_RGBA[1];
        flashColors[index * 4 + 2] = PULSE_FLASH_RGBA[2];
        flashColors[index * 4 + 3] = PULSE_FLASH_RGBA[3];
      });
      graph.setPointColors(flashColors);
      graph.render(undefined, PULSE_FLASH_MS);

      const fadeKey = graphNodeIds.join("|");
      if (pulseTimeoutsRef.current[fadeKey]) {
        clearTimeout(pulseTimeoutsRef.current[fadeKey]);
      }
      pulseTimeoutsRef.current[fadeKey] = setTimeout(() => {
        delete pulseTimeoutsRef.current[fadeKey];
        const currentBaseColors = baseColorsRef.current;
        if (!graphRef.current || !currentBaseColors) {
          return;
        }
        graphRef.current.setPointColors(currentBaseColors);
        graphRef.current.render(undefined, PULSE_FADE_MS);
      }, PULSE_FLASH_MS);
    };

    const onTaskEvent = (
      _event: unknown,
      payload?: { taskId?: number; agentId?: number },
    ) => {
      if (!payload?.taskId) {
        return;
      }
      const graphNodeIds = [`AGENT_TASK:${payload.taskId}`];
      if (payload.agentId) {
        graphNodeIds.push(`AGENT:${payload.agentId}`);
      }
      pulseNodes(graphNodeIds);
    };

    const unsubscribeAssigned = window?.electron?.on(
      MESSAGE.AGENT_TASK_ASSIGNED,
      onTaskEvent,
    );
    const unsubscribeFinished = window?.electron?.on(
      MESSAGE.AGENT_TASK_FINISHED,
      onTaskEvent,
    );

    return () => {
      unsubscribeAssigned?.();
      unsubscribeFinished?.();
      Object.values(pulseTimeoutsRef.current).forEach((timeoutId) =>
        clearTimeout(timeoutId),
      );
      pulseTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }

    const normalizedSearch = searchText.trim().toLowerCase();
    const hasSearch = Boolean(normalizedSearch);
    const hasCategoryFilter = CATEGORY_LIST.some(
      (category) => !activeCategories[category.type],
    );
    const focusNodeId = hoveredNodeId || selectedNodeId;
    const focusIds = focusNodeId
      ? expandFocusIds(focusNodeId, nodes, edges)
      : null;

    const anyRestriction = hasSearch || hasCategoryFilter || Boolean(focusIds);
    if (!anyRestriction) {
      graph.setConfigPartial({
        highlightedPointIndices: undefined,
        highlightedLinkIndices: [],
      });
      return;
    }

    const visibleNodeIds = new Set<string>();
    layoutNodesRef.current.forEach((node) => {
      const categoryOn = activeCategories[node.type];
      const matchesSearch =
        !hasSearch ||
        displayLabel(node).toLowerCase().includes(normalizedSearch);
      const inFocus = !focusIds || focusIds.has(node.id);
      if (categoryOn && matchesSearch && inFocus) {
        visibleNodeIds.add(node.id);
      }
    });

    const highlightedPointIndices: number[] = [];
    layoutNodesRef.current.forEach((node, index) => {
      if (visibleNodeIds.has(node.id)) {
        highlightedPointIndices.push(index);
      }
    });

    const highlightedLinkIndices: number[] = [];
    edges.forEach((edge, index) => {
      if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
        highlightedLinkIndices.push(index);
      }
    });

    graph.setConfigPartial({ highlightedPointIndices, highlightedLinkIndices });
  }, [
    activeCategories,
    searchText,
    selectedNodeId,
    hoveredNodeId,
    nodes,
    edges,
  ]);

  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : null;

  const normalizedSearch = searchText.trim().toLowerCase();
  const focusIds = selectedNodeId
    ? new Set([selectedNodeId, ...neighborIdsOf(selectedNodeId, edges)])
    : null;
  const labelNodes = nodes.filter((node) => {
    const categoryOn = activeCategories[node.type];
    const matchesSearch =
      !normalizedSearch ||
      displayLabel(node).toLowerCase().includes(normalizedSearch);
    const inFocus = !focusIds || focusIds.has(node.id);
    return categoryOn && matchesSearch && inFocus;
  });

  return (
    <Wrapper>
      <div className="header">
        <div>
          <div className="header-title">
            {translate("relationshipGraph.title")}
          </div>
        </div>
        <div className="header-search">
          <PasswordInput
            name="relationshipGraphEncryptKey"
            placeholder={translate("wallet.encryptKey")}
            width="14rem"
            extendClass="relationship-graph"
            onChange={onChangeEncryptKey}
            initialValue={encryptKeyInputValue}
            shouldHideValue
          />
          <SearchInput
            value={searchText}
            onChange={setSearchText}
            placeholder={translate("relationshipGraph.searchPlaceholder")}
          />
        </div>
      </div>

      <div className="legend">
        {CATEGORY_LIST.map((category) => {
          const count = nodes.filter(
            (node) => node.type === category.type,
          ).length;
          const active = activeCategories[category.type];
          return (
            <div
              key={category.type}
              className={`legend-chip ${active ? "active" : "off"}`}
              onClick={() => onToggleCategory(category.type)}
              onDoubleClick={() => onZoomToCategory(category.type)}
              title={translate("relationshipGraph.legend.chipTooltip")}
            >
              <span
                className="swatch"
                style={{ background: legendSwatchBackground(category.type) }}
              />
              {translate(category.labelKey)}
              <span className="count">{count}</span>
              <span
                className="only-link"
                onClick={(event) => {
                  event.stopPropagation();
                  onIsolateCategory(category.type);
                }}
              >
                {translate("relationshipGraph.legend.only")}
              </span>
            </div>
          );
        })}
        {Object.values(activeCategories).some((isActive) => !isActive) ? (
          <div className="legend-show-all" onClick={onShowAllCategories}>
            {translate("relationshipGraph.legend.showAll")}
          </div>
        ) : null}
      </div>

      <div className="graph-area">
        <div className="graph-canvas" style={{ position: "relative" }}>
          <div
            ref={canvasContainerRef}
            style={{ position: "absolute", inset: 0 }}
          />
          <div
            ref={labelLayerRef}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {labelNodes.map((node) => (
              <div
                key={node.id}
                ref={(element) => {
                  labelElementRefs.current[node.id] = element;
                }}
                style={{
                  position: "absolute",
                  left: 10,
                  top: -6,
                  display: "none",
                  fontSize: "1.1rem",
                  whiteSpace: "nowrap",
                  color: isLightMode ? "#555555" : "#c8c8c8",
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
              >
                {displayLabel(node)}
              </div>
            ))}
          </div>

          {loading && nodes.length === 0 ? (
            <Spin style={{ margin: "6rem auto", display: "flex" }} />
          ) : nodes.length === 0 ? (
            <Empty style={{ margin: "6rem auto" }} />
          ) : null}

          <div className="stat-strip">
            <div className="stat">
              <b>{nodes.length}</b>
              <span>{translate("relationshipGraph.stat.entities")}</span>
            </div>
            <div className="stat">
              <b>{edges.length}</b>
              <span>{translate("relationshipGraph.stat.links")}</span>
            </div>
          </div>

          <div className="zoom-controls">
            <div
              className="zoom-button"
              onClick={onZoomIn}
              title={translate("relationshipGraph.zoom.in")}
            >
              +
            </div>
            <div
              className="zoom-button"
              onClick={onZoomOut}
              title={translate("relationshipGraph.zoom.out")}
            >
              &minus;
            </div>
            <div
              className="zoom-button"
              onClick={onFitView}
              title={translate("relationshipGraph.zoom.fit")}
            >
              &#x2922;
            </div>
          </div>

          <div className={`hint ${selectedNode ? "panel-open" : ""}`}>
            {translate("relationshipGraph.hint")}
          </div>
        </div>

        {selectedNode ? (
          <DetailPanel
            selectedNode={selectedNode}
            nodesById={nodesById}
            edges={edges}
            isLightMode={isLightMode}
            hasEncryptKey={hasEncryptKey}
            nodeDisplayColor={nodeDisplayColor}
            onClose={() => setSelectedNodeId(null)}
          />
        ) : null}
      </div>
    </Wrapper>
  );
};

export default connect((state: RootState) => ({
  isLightMode: state?.Layout?.isLightMode,
}))(RelationshipGraph);
