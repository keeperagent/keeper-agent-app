import { useRef } from "react";
import { connect } from "react-redux";
import { Tooltip } from "antd";
import { RootState } from "@/redux/store";
import { DragIcon, BookMarkIcon } from "@/component/Icon";
import { INodeData } from "@/types/interface";
import { IPreference } from "@/electron/type";
import { useUpdatePreference, useTranslation } from "@/hook";
import { INode } from "../common";
import { NodeWrapper } from "./style";
import { useEffect } from "react";

type INodeProps = {
  node: INode;
  onDragStart?: (event: React.DragEvent, nodeData: INodeData) => void;
  draggable?: boolean;
  isActive?: boolean;
  preference: IPreference | null;
  isSelected?: boolean;
  showBookMark?: boolean;
  disableScroll?: boolean;
};

let previouSelected: any = null;

const Node = (props: INodeProps) => {
  const { translate } = useTranslation();
  const {
    node,
    onDragStart,
    draggable,
    isActive,
    preference,
    isSelected,
    showBookMark,
    disableScroll,
  } = props;
  const { icon: Icon, version } = node;
  const { updatePreference } = useUpdatePreference();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected !== previouSelected) {
      previouSelected = isSelected;
    }

    if (isSelected && !disableScroll) {
      elementRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isSelected, disableScroll]);

  const onBookMark = async () => {
    if (!isActive) {
      await updatePreference({
        ...preference,
        nodeBlackList: preference?.nodeBlackList?.filter(
          (workflowType: string) => workflowType !== node?.config?.workflowType
        ),
      });
    } else {
      await updatePreference({
        ...preference,
        nodeBlackList: [
          ...preference?.nodeBlackList!,
          node?.config?.workflowType!,
        ],
      });
    }
  };

  return (
    <NodeWrapper
      onDragStart={(event) => {
        onDragStart &&
          onDragStart(event, {
            type: node?.type,
            config: node?.config,
            version: version,
          });
      }}
      draggable={draggable}
      className={isSelected ? "selected" : ""}
      style={{ cursor: draggable ? "grab" : "" }}
      ref={elementRef}
    >
      <div className="icon">{Icon}</div>
      <div className="name">{node?.config?.name}</div>

      {draggable && (
        <div className="drag">
          <DragIcon />
        </div>
      )}

      {showBookMark && (
        <Tooltip
          title={
            isActive ? translate("select.unSelect") : translate("select.select")
          }
        >
          <div className="bookmark" onClick={onBookMark}>
            <BookMarkIcon
              isActive={isActive}
              id={`bookmark_${node?.config?.workflowType?.toLowerCase()}`}
            />
          </div>
        </Tooltip>
      )}
    </NodeWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
  }),
  {}
)(Node);
