import { useMemo, useState } from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { Empty } from "antd";
import { RootState } from "@/redux/store";
import { SearchInput } from "@/component/Input";
import { actSetSelectedWorkflowType } from "@/redux/workflowRunner";
import { useTranslation } from "@/hook";
import { SCRIPT_NAME_EN } from "@/config/constant";
import { WORKFLOW_TYPE } from "@/electron/constant";
import Node from "../../Panel/Node";
import { getListNode, INodeGroup } from "../../Panel/config";
import { removeSpecialCharacter } from "../../Panel/util";
import { INode } from "../../Panel/common";
import { Wrapper } from "./style";
import Content from "./Content";

const NodeInstruction = (props: any) => {
  const { selectedWorkflowType } = props;
  const { translate } = useTranslation();
  const [searchText, onSetSearchText] = useState("");

  const listNode = useMemo(() => {
    const listData = getListNode();
    if (!searchText) {
      return listData;
    }

    const regex = new RegExp(
      removeSpecialCharacter(searchText.toLowerCase()),
      "g",
    );

    return listData?.map((listNode: INodeGroup) => ({
      ...listNode,
      children: listNode?.children?.filter(
        (node: INode) =>
          SCRIPT_NAME_EN[node?.config?.workflowType as WORKFLOW_TYPE]
            ?.toLowerCase()
            ?.search(regex) !== -1 ||
          listNode?.label?.toLowerCase()?.search(regex) !== -1,
      ),
    }));
  }, [searchText]);

  const selectedNode: INode | null = useMemo(() => {
    let listData: INode[] = [];
    getListNode()?.forEach((listNode: INodeGroup) => {
      listData = [...listData, ...listNode?.children];
    });

    let node = listData?.filter(
      (node: INode) => node?.config?.workflowType === selectedWorkflowType,
    )?.[0];

    if (!node) {
      node = listData[0];
    }

    return node;
  }, [selectedWorkflowType]);

  const onClickNode = (node: INode) => {
    props?.actSetSelectedWorkflowType(node?.config?.workflowType);
  };

  return (
    <Wrapper>
      <div className="search">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
        />
      </div>

      <div className="main">
        <div className="left">
          {listNode?.map((group: INodeGroup, groupIndex: number) => {
            const listNode = group?.children;

            if (listNode.length === 0) {
              return null;
            }

            return (
              <div key={groupIndex} className="group">
                <div className="label">{group?.label}</div>

                <div className="list-node">
                  {listNode?.map((node: INode, index: number) => (
                    <div
                      className="node-wrapper"
                      key={`${groupIndex}-${index}`}
                      onClick={() => onClickNode(node)}
                    >
                      <Node
                        node={node}
                        isSelected={
                          selectedWorkflowType === node?.config?.workflowType
                        }
                        disableScroll={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {_.sum(
            listNode?.map((group: INodeGroup) => group?.children?.length),
          ) === 0 && (
            <div className="empty">
              <Empty />
            </div>
          )}
        </div>

        <div className="content-wrapper">
          <Content selectedNode={selectedNode} />
        </div>
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    selectedWorkflowType: state?.WorkflowRunner?.selectedWorkflowType,
  }),
  {
    actSetSelectedWorkflowType,
  },
)(NodeInstruction);
