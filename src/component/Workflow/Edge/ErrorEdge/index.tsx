import { useCallback, Fragment } from "react";
import {
  useStore,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
} from "@xyflow/react";
import { getEdgeParams } from "../util";
import Queue from "../Queue";

const ErrorEdge = (props: any) => {
  const { id, source, target, markerEnd, data, selected } = props;

  const sourceNode = useStore(
    useCallback((store) => store.nodeLookup.get(source), [source]),
  );
  const targetNode = useStore(
    useCallback((store) => store.nodeLookup.get(target), [target]),
  );

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const edgeStyle = {
    stroke: "#ff4d4f",
    strokeWidth: 1,
    strokeDasharray: "6 3",
  };

  return (
    <Fragment>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {data?.withQueue && (
        <EdgeLabelRenderer>
          <Queue
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            edgeID={id}
            selected={selected}
            conditionLabel="ERROR"
            conditionColor="var(--color-error)"
            maxConcurrency={
              (targetNode?.data?.config as any)?.maxConcurrency || 0
            }
          />
        </EdgeLabelRenderer>
      )}
    </Fragment>
  );
};

export default ErrorEdge;
