import { Handle, Position } from "@xyflow/react";
import { RedoIcon } from "@/component/Icon";
import { Wrapper } from "./style";

const StartNode = (_props: any) => {
  return (
    <Wrapper>
      <div className="text">Start</div>
      <div className="handle-area">
        <Handle
          className="node-handle"
          position={Position.Right}
          type="source"
        />

        <div className="icon">
          <RedoIcon color="var(--color-primary)" />
        </div>
      </div>
    </Wrapper>
  );
};

export default StartNode;
