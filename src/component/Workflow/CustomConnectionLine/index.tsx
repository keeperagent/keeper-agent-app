import { getStraightPath, ConnectionLineComponentProps } from "@xyflow/react";
import { EDGE_HANDLE } from "@/config/constant";

const CustomConnectionLine = (props: ConnectionLineComponentProps) => {
  const {
    fromX,
    fromY,
    toX,
    toY,
    fromNode,
    toNode,
    fromHandle,
    connectionLineStyle,
  } = props;

  const fromNodeWidth = (fromNode as any)?.measured?.width || 0;
  const fromNodeHeight = (fromNode as any)?.measured?.height || 0;
  const fromNodePos = (fromNode as any)?.internals?.positionAbsolute;
  const sourceDotX = fromNodePos ? fromNodePos.x + fromNodeWidth : fromX;
  const sourceDotY = fromNodePos ? fromNodePos.y + fromNodeHeight / 2 : fromY;

  let targetX = toX;
  let targetY = toY;

  if (toNode && toNode.id !== fromNode?.id) {
    const width = toNode?.measured?.width || 0;
    const height = toNode?.measured?.height || 0;
    const posAbs = toNode?.internals?.positionAbsolute;
    if (posAbs) {
      targetX = posAbs.x + width / 2;
      targetY = posAbs.y + height / 2;
    }
  }

  const [edgePath] = getStraightPath({
    sourceX: sourceDotX,
    sourceY: sourceDotY,
    targetX,
    targetY,
  });

  const dotColor =
    fromHandle?.id === EDGE_HANDLE.SUCCESS
      ? "#52c41a"
      : fromHandle?.id === EDGE_HANDLE.ERROR
        ? "#ff4d4f"
        : "black";

  return (
    <g>
      <path style={connectionLineStyle} fill="none" d={edgePath} />
      <circle
        cx={sourceDotX}
        cy={sourceDotY}
        fill={dotColor}
        r={3}
        strokeWidth={0}
      />
      <circle cx={targetX} cy={targetY} fill={dotColor} r={3} strokeWidth={0} />
    </g>
  );
};

export default CustomConnectionLine;
