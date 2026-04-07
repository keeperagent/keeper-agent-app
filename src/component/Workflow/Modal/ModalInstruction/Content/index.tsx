import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { INode } from "../../../Panel/common";
import Node from "../../../Panel/Node";
import { getNodeContent } from "./config";

type IProps = {
  selectedNode: INode | null;
};

const Content = (props: IProps) => {
  const { selectedNode } = props;
  const { translate } = useTranslation();

  const nodeContent = getNodeContent(
    selectedNode?.config?.workflowType || "",
    translate,
  );

  return (
    <Wrapper>
      <div className="item">
        <div className="label">{translate("guide.toolShape")}</div>
        <div className="node-wrapper">
          {selectedNode && <Node node={selectedNode} />}
        </div>
      </div>

      <div className="item">
        <div className="label">{translate("guide.desc")}</div>

        <div className="content">{nodeContent?.description}</div>
      </div>
    </Wrapper>
  );
};

export default connect((_state: RootState) => ({}), {})(Content);
