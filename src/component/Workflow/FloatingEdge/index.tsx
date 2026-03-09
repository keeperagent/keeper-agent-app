import { useCallback, Fragment } from "react";
import {
  useStore,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
} from "@xyflow/react";
import { getEdgeParams } from "./util";
import Label from "./Label";

// reference: https://reactflow.dev/docs/examples/edges/simple-floating-edges/

const FloatingEdge = (props: any) => {
  const { id, source, target, markerEnd, style, data, selected } = props;

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

  return (
    <Fragment>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {data?.withQueue && (
        <EdgeLabelRenderer>
          <Label
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              // everything inside EdgeLabelRenderer has no pointer events by default
              // if you have an interactive element, set pointer-events: all
              pointerEvents: "all",
            }}
            edgeID={id}
            selected={selected}
          />
        </EdgeLabelRenderer>
      )}
    </Fragment>
  );
};

export default FloatingEdge;
