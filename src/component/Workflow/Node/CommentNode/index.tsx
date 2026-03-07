import { NodeResizer, Node, useNodeId } from "@xyflow/react";
import { connect } from "react-redux";
import TextareaAutosize from "react-textarea-autosize";
import { RootState } from "@/redux/store";
import { actSetNodes } from "@/redux/workflowRunner";
import { Wrapper } from "./style";
import { ChangeEvent } from "react";

type ICommentNodeConfig = {
  name?: string;
  workflowType?: string;
  status?: string;
  content?: string;
  actSetNodes: (payload: { nodes: Node[]; saveHistory: boolean }) => void;
};

const CommentNode = (props: any) => {
  const { data, selected, nodes } = props;
  const nodeId = useNodeId();
  const config = data?.config as ICommentNodeConfig;

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event?.target;

    const newNodes = nodes.map((node: Node) => {
      let newNode = node;
      if (newNode?.id === nodeId) {
        const nodeData = {
          ...node.data,
          config: {
            ...(node?.data?.config as ICommentNodeConfig),
            content: value,
          },
        };
        newNode = { ...newNode, data: nodeData };
      }

      return newNode;
    });
    props?.actSetNodes({ nodes: newNodes, saveHistory: false });
  };

  return (
    <Wrapper>
      <NodeResizer
        color="#ff0071"
        isVisible={selected}
        minWidth={100}
        minHeight={30}
      />

      <div className="content">
        <TextareaAutosize value={config?.content || ""} onChange={onChange} />
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes || [],
  }),
  { actSetNodes },
)(CommentNode);
