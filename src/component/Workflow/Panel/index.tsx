import { useState, useEffect, useMemo } from "react";
import { Tooltip } from "antd";
import _ from "lodash";
import { useNavigate, useLocation } from "react-router-dom";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { SearchInput } from "@/component/Input";
import {
  BackIcon,
  FlameIcon,
  ExpandIcon,
  CompressIcon,
  SettingIcon,
  BookIcon,
} from "@/component/Icon";
import { INodeData } from "@/types/interface";
import {
  actSetModalPreferenceOpen,
  actSetIsFullscreen,
  actSetShowModalSetting,
  actSetShowModalInstruction,
} from "@/redux/workflowRunner";
import { IPreference } from "@/electron/type";
import { MESSAGE, WORKFLOW_TYPE } from "@/electron/constant";
import { useGetPreference, useTranslation } from "@/hook";
import { IUndoRedo } from "@/redux/workflowRunner";
import {
  actSetModalCampaignOpen,
  actSetCurrentModalStep,
} from "@/redux/campaign";
import { PanelWrapper } from "./style";
import Node from "./Node";
import { INode } from "./common";
import { getListNode, INodeGroup } from "./config";
import ModalPreference from "./ModalPreference";
import { removeSpecialCharacter } from "./util";
import BeforeRouteChangeBlocker from "../../BeforeRouteChangeBlocker";
import { SCRIPT_NAME_EN } from "@/config/constant";

type IProps = {
  preference: IPreference | null;
  actSetModalPreferenceOpen: (payload: boolean) => void;
  actSetIsFullscreen: (payload: boolean) => void;
  actSetShowModalSetting: (payload: boolean) => void;
  actSetModalCampaignOpen: (payload: boolean) => void;
  actSetCurrentModalStep: (payload: number) => void;
  actSetShowModalInstruction: (payload: boolean) => void;
  isFullScreen: boolean;
  flowData: IUndoRedo | null;
  selectedNodeID: string | null;
};

const Panel = (props: IProps) => {
  const { preference, isFullScreen, flowData, selectedNodeID } = props;
  const { nodes = [] } = flowData?.present || {};
  const { translate } = useTranslation();
  const [searchText, onSetSearchText] = useState("");

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { getPreference } = useGetPreference();

  useEffect(() => {
    getPreference();
  }, []);

  const listNode = useMemo(() => {
    const listData = getListNode();
    if (!searchText) {
      return listData;
    }

    return listData?.map((listNode: INodeGroup) => {
      const regex = new RegExp(
        removeSpecialCharacter(searchText.toLowerCase()),
        "g",
      );

      return {
        ...listNode,
        children: listNode?.children?.filter(
          (node: INode) =>
            SCRIPT_NAME_EN[node?.config?.workflowType as WORKFLOW_TYPE]
              ?.toLowerCase()
              ?.search(regex) !== -1 ||
            listNode?.label?.toLowerCase()?.search(regex) !== -1,
        ),
      };
    });
  }, [searchText]);

  const selectedNode: any = useMemo(() => {
    return _.find(nodes, { id: selectedNodeID });
  }, [selectedNodeID, nodes]);

  const isCampaignView = useMemo(() => {
    return pathname === "/dashboard/campaign";
  }, [pathname]);

  const onDragStart = (event: React.DragEvent, nodeData: INodeData) => {
    event.dataTransfer.setData("data", JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = "move";
  };

  const onBack = () => {
    if (isFullScreen) {
      props?.actSetIsFullscreen(false);

      setTimeout(() => {
        window?.electron?.send(MESSAGE.EXIT_FULL_SCREEN);
      }, 1000);
    }
    navigate(pathname);
  };

  const onOpenModalPreference = () => {
    props?.actSetModalPreferenceOpen(true);
  };

  const onToggleFullscreen = () => {
    props?.actSetIsFullscreen(!isFullScreen);

    setTimeout(() => {
      if (isFullScreen) {
        window?.electron?.send(MESSAGE.EXIT_FULL_SCREEN);
      } else {
        window?.electron?.send(MESSAGE.ENTER_FULL_SCREEN);
      }
    }, 1000);
  };

  const onOpenModalSetting = () => {
    if (isCampaignView) {
      props?.actSetModalCampaignOpen(true);
      props?.actSetCurrentModalStep(1);
    } else {
      props?.actSetShowModalSetting(true);
    }
  };

  const onOpenModalInstruction = () => {
    props?.actSetShowModalInstruction(true);
  };

  return (
    <PanelWrapper>
      <div className="heading">
        <BeforeRouteChangeBlocker onClick={onBack}>
          <div className="back">
            <div className="icon">
              <BackIcon />
            </div>
            <div className="text">{translate("back")}</div>
          </div>
        </BeforeRouteChangeBlocker>

        <div className="zoom-icon" onClick={onToggleFullscreen}>
          {isFullScreen ? (
            <Tooltip title={translate("workflow.exitFullscreen")}>
              <span>
                <CompressIcon />
              </span>
            </Tooltip>
          ) : (
            <Tooltip title={translate("workflow.fullscreen")}>
              <span>
                <ExpandIcon />
              </span>
            </Tooltip>
          )}
        </div>

        <div className="setting" onClick={onOpenModalInstruction}>
          <Tooltip title={translate("guide")}>
            <span>
              <BookIcon />
            </span>
          </Tooltip>
        </div>

        <Tooltip title={translate("sidebar.preference")}>
          <div className="setting" onClick={onOpenModalPreference}>
            <span>
              <FlameIcon />
            </span>
          </div>
        </Tooltip>

        <div className="setting" onClick={onOpenModalSetting}>
          <Tooltip title={translate("workflow.setting")}>
            <span>
              <SettingIcon />
            </span>
          </Tooltip>
        </div>
      </div>

      <div className="search">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
        />
      </div>

      <div className="list-node">
        {listNode?.map((group: INodeGroup, groupIndex: number) => {
          const listNode = group?.children?.filter(
            (node: INode) =>
              !preference?.nodeBlackList?.includes(node?.config?.workflowType!),
          );

          if (listNode.length === 0) {
            return null;
          }

          return (
            <div key={groupIndex} className="group">
              <div className="label">{group?.label}</div>

              {listNode?.map((node: INode, index: number) => (
                <Node
                  node={node}
                  onDragStart={onDragStart}
                  key={`${groupIndex}-${index}`}
                  draggable={true}
                  isSelected={
                    selectedNode?.data?.config?.workflowType ===
                    node?.config?.workflowType
                  }
                />
              ))}
            </div>
          );
        })}
      </div>

      <ModalPreference />
    </PanelWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
    isFullScreen: state?.WorkflowRunner?.isFullScreen,
    selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
    flowData: state?.WorkflowRunner?.flowData,
  }),
  {
    actSetModalPreferenceOpen,
    actSetIsFullscreen,
    actSetShowModalSetting,
    actSetModalCampaignOpen,
    actSetCurrentModalStep,
    actSetShowModalInstruction,
  },
)(Panel);
