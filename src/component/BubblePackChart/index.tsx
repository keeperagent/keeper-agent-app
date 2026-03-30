import { useMemo, useState, useEffect, useRef, Fragment } from "react";
import { pack, hierarchy, HierarchyCircularNode } from "d3-hierarchy";

export type BubbleDataNode = {
  name: string;
  value?: number;
  nodeType: "root" | "profileGroup" | "walletGroup" | "resourceGroup";
  tooltipLabel?: string;
  children?: BubbleDataNode[];
};

type TooltipState = {
  x: number;
  y: number;
  content: string;
} | null;

type IProps = {
  treeData: BubbleDataNode;
  maxSize?: number;
  minHeight?: number;
};

// depth 0 = root, depth 1 = container (profileGroup), depth 2+ = leaf
// Root + containers are glass; leaves are fully opaque and vibrant.
const DEPTH_GRADIENTS = [
  {
    id: "bpc-grad-0",
    inner: "#3B82F6",
    outer: "#0D1B3E",
    innerOpacity: 0.18,
    outerOpacity: 0.08,
    stroke: "rgba(96,165,250,0.45)",
    strokeWidth: 1.5,
  },
  {
    id: "bpc-grad-1",
    inner: "#3B82F6",
    outer: "#1E3A8A",
    innerOpacity: 0.35,
    outerOpacity: 0.2,
    stroke: "rgba(96,165,250,0.4)",
    strokeWidth: 1,
  },
  {
    id: "bpc-grad-wallet",
    inner: "#34D399",
    outer: "#064E3B",
    innerOpacity: 0.95,
    outerOpacity: 0.9,
    stroke: "rgba(52,211,153,0.3)",
    strokeWidth: 1,
  },
  {
    id: "bpc-grad-resource",
    inner: "#FBBF24",
    outer: "#78350F",
    innerOpacity: 0.95,
    outerOpacity: 0.9,
    stroke: "rgba(251,191,36,0.3)",
    strokeWidth: 1,
  },
];

const GLOW_COLORS = ["#1D4ED8", "#3B82F6", "#10B981", "#F59E0B"];
const GLOW_RADIUS_FACTOR = [0.08, 0.14, 0.32, 0.32];
const FLOAT_CLASSES = ["b-float-a", "b-float-b", "b-float-c"];

const SVG_STYLES = `
  .bpc-node {
    transform-box: fill-box;
    transform-origin: center;
    animation: bpcBubbleIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    transition: transform 0.2s ease, filter 0.2s ease;
  }
  .bpc-node.leaf:hover {
    transform: scale(1.08);
  }
  .bpc-float {
    transform-box: fill-box;
    transform-origin: center;
  }
  .b-float-a { animation: bpcFloatA 3.4s ease-in-out infinite; }
  .b-float-b { animation: bpcFloatB 4.2s ease-in-out infinite; }
  .b-float-c { animation: bpcFloatC 5.0s ease-in-out infinite; }
  .bpc-label {
    pointer-events: none;
    user-select: none;
    animation: bpcFadeIn 0.4s ease both;
  }
  @keyframes bpcBubbleIn {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  @keyframes bpcFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes bpcFloatA {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-7px); }
  }
  @keyframes bpcFloatB {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-5px); }
  }
  @keyframes bpcFloatC {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-9px); }
  }
`;

const resolveGradientIndex = (
  nodeType: BubbleDataNode["nodeType"],
  depth: number,
) => {
  if (nodeType === "walletGroup") {
    return 2;
  }
  if (nodeType === "resourceGroup") {
    return 3;
  }
  return Math.min(depth, 1);
};

const BubblePackChart = (props: IProps) => {
  const { treeData, maxSize = 400, minHeight = 400 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width || 500);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const packedRoot = useMemo(() => {
    const chartSize = Math.min(containerWidth, maxSize);

    const root = hierarchy(treeData)
      .sum((bubbleNode) => bubbleNode.value || 0)
      .sort((nodeA, nodeB) => (nodeB.value || 0) - (nodeA.value || 0));

    return pack<BubbleDataNode>()
      .size([chartSize, chartSize])
      .padding((node) => {
        if (node.depth === 0) {
          return 20;
        }
        return 25;
      })(root);
  }, [treeData, containerWidth, maxSize]);

  const handleMouseEnter = (
    event: React.MouseEvent,
    node: HierarchyCircularNode<BubbleDataNode>,
  ) => {
    if (node.depth === 0) {
      return;
    }
    const nodeData = node.data;
    const content = nodeData.tooltipLabel
      ? `${nodeData.name}: ${nodeData.tooltipLabel}`
      : nodeData.name;
    if (!content) {
      return;
    }
    setTooltipState({ x: event.clientX, y: event.clientY, content });
  };

  const handleMouseLeave = () => {
    setTooltipState(null);
  };

  const chartSize = Math.min(containerWidth, maxSize);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight,
      }}
    >
      <svg
        width={chartSize}
        height={chartSize}
        viewBox={`0 0 ${chartSize} ${chartSize}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {DEPTH_GRADIENTS.map((gradient) => (
            <radialGradient
              key={gradient.id}
              id={gradient.id}
              cx="35%"
              cy="30%"
              r="70%"
            >
              <stop
                offset="0%"
                stopColor={gradient.inner}
                stopOpacity={gradient.innerOpacity}
              />
              <stop
                offset="100%"
                stopColor={gradient.outer}
                stopOpacity={gradient.outerOpacity}
              />
            </radialGradient>
          ))}
          <radialGradient id="bpc-highlight" cx="40%" cy="25%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>

        <style>{SVG_STYLES}</style>

        {packedRoot
          .descendants()
          .map(
            (
              node: HierarchyCircularNode<BubbleDataNode>,
              nodeIndex: number,
            ) => {
              const nodeData = node.data;
              const isLeaf = !node.children;
              const gradientIndex = resolveGradientIndex(
                nodeData.nodeType,
                node.depth,
              );
              const glowColor = GLOW_COLORS[gradientIndex];
              const glowRadius = Math.max(
                node.r * GLOW_RADIUS_FACTOR[gradientIndex],
                4,
              );
              const depthConfig = DEPTH_GRADIENTS[gradientIndex];
              const fontSize = Math.min(node.r * 0.22, 10);
              const maxChars = Math.max(
                Math.floor((node.r * 1.5) / (fontSize * 0.6)),
                3,
              );
              const showLabel = isLeaf && node.r > 22 && maxChars >= 4;
              const displayName =
                nodeData.name.length > maxChars
                  ? `${nodeData.name.slice(0, maxChars - 1)}…`
                  : nodeData.name;
              const clipId = `bpc-clip-${nodeIndex}`;
              const animDelay = `${nodeIndex * 35}ms`;
              const floatDelay = `${0.55 + nodeIndex * 0.035 + (nodeIndex % 3) * 0.6}s`;
              const floatClass =
                node.depth > 0
                  ? `bpc-float ${FLOAT_CLASSES[nodeIndex % 3]}`
                  : "";

              return (
                <g
                  key={nodeIndex}
                  className={floatClass}
                  style={
                    node.depth > 0 ? { animationDelay: floatDelay } : undefined
                  }
                >
                  <circle
                    className={`bpc-node${isLeaf ? " leaf" : ""}`}
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={`url(#${depthConfig.id})`}
                    stroke={depthConfig.stroke}
                    strokeWidth={depthConfig.strokeWidth}
                    style={{
                      animationDelay: animDelay,
                      filter: `drop-shadow(0 0 ${glowRadius}px ${glowColor}88)`,
                      cursor: node.depth > 0 ? "pointer" : "default",
                    }}
                    onMouseEnter={(event) => handleMouseEnter(event, node)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {isLeaf && (
                    <circle
                      cx={node.x - node.r * 0.22}
                      cy={node.y - node.r * 0.22}
                      r={node.r * 0.45}
                      fill="url(#bpc-highlight)"
                      pointerEvents="none"
                      style={{ animationDelay: animDelay }}
                      className="bpc-node"
                    />
                  )}

                  {showLabel && (
                    <Fragment>
                      <defs>
                        <clipPath id={clipId}>
                          <circle cx={node.x} cy={node.y} r={node.r * 0.82} />
                        </clipPath>
                      </defs>
                      <text
                        className="bpc-label"
                        x={node.x}
                        y={node.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize}
                        fill="rgba(255,255,255,0.9)"
                        fontWeight={500}
                        letterSpacing="0.3"
                        clipPath={`url(#${clipId})`}
                        style={{ animationDelay: `${nodeIndex * 35 + 150}ms` }}
                      >
                        {displayName}
                      </text>
                    </Fragment>
                  )}
                </g>
              );
            },
          )}
      </svg>

      {tooltipState && (
        <div
          style={{
            position: "fixed",
            left: tooltipState.x + 12,
            top: tooltipState.y - 28,
            background: "rgba(15,15,25,0.9)",
            color: "#e2e8f0",
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: 12,
            border: "1px solid rgba(59,130,246,0.5)",
            pointerEvents: "none",
            zIndex: 9999,
            backdropFilter: "blur(8px)",
          }}
        >
          {tooltipState.content}
        </div>
      )}
    </div>
  );
};

export default BubblePackChart;
