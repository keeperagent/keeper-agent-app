import { Handle, Position } from "@xyflow/react";
import { Wrapper } from "./style";

const EndNode = () => {
  return (
    <Wrapper>
      <div className="text">End</div>
      <div className="handle-area">
        <Handle
          className="node-handle"
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />
      </div>
    </Wrapper>
  );
};

export default EndNode;
