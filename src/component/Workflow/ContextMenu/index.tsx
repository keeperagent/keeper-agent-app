import { useMemo } from "react";
import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import { connect } from "react-redux";
import _ from "lodash";
import { Node } from "@xyflow/react";
import { RootState } from "@/redux/store";
import { IMousePosition } from "@/types/interface";
import {
  BroomIcon,
  PlayIcon,
  StopIcon,
  GearIcon,
  EyeOpenIcon,
  CopyBoldIcon,
  BookBoldIcon,
  CameraIcon,
  PaperIcon,
  GrowthIcon,
  VerticalIcon,
  HorizontalIcon,
} from "@/component/Icon";
import {
  actSetModalOpen,
  actSetModalQueueOpen,
  actSetShowModalInstruction,
  actSetModalSampleContractSniperResultOpen,
  actSetModalPriceCheckingOpen,
  actSetModalMarketcapCheckingOpen,
  actSetSelectedWorkflowType,
} from "@/redux/workflowRunner";
import { useTranslation } from "@/hook";
import { MenuWrapper, MenuItemWrapper } from "./style";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { LayoutDirection } from "../util";

interface ContextMenuProps {
  menuProps?: any;
  anchorPoint: IMousePosition;
  toggleMenu: (payload: boolean) => any;
  onStartStopNode: (payload: boolean) => any;
  onDuplicateNode: () => void;
  selectedNodeID: string | null;
  selectedEdgeID: string | null;
  actSetModalOpen: (payload: boolean) => any;
  actSetModalQueueOpen: (payload: boolean) => any;
  actSetModalSampleContractSniperResultOpen: (payload: boolean) => any;
  actSetModalPriceCheckingOpen: (payload: boolean) => any;
  actSetModalMarketcapCheckingOpen: (payload: boolean) => any;
  actSetShowModalInstruction: (payload: boolean) => any;
  actSetSelectedWorkflowType: (payload: string | null) => any;
  nodes: Node[];
  selectedWorkflowType: string | null;
  onLayout: (payload: LayoutDirection) => void;
}

const ContextMenu = (props: ContextMenuProps) => {
  const { translate } = useTranslation();
  const {
    menuProps,
    anchorPoint,
    toggleMenu,
    selectedNodeID,
    onStartStopNode,
    selectedEdgeID,
    onDuplicateNode,
    nodes,
    selectedWorkflowType,
    onLayout,
  } = props;

  const selectedNode: any = useMemo(() => {
    return _.find(nodes, { id: selectedNodeID });
  }, [selectedNodeID, nodes]);

  const onRun = () => {
    onStartStopNode(true);
  };

  const onStop = () => {
    onStartStopNode(false);
    return;
  };

  const onOpenModalNodeConfig = () => {
    props?.actSetModalOpen(true);
  };

  const onOpenModalQueueData = () => {
    props?.actSetModalQueueOpen(true);
  };

  const onOpenModalInstruction = () => {
    props?.actSetShowModalInstruction(true);
    props?.actSetSelectedWorkflowType(selectedNode?.data?.config?.workflowType);
  };

  const onOpenModalViewContractSniperResult = () => {
    props?.actSetModalSampleContractSniperResultOpen(true);
  };

  const onOpenModalPriceChecking = () => {
    props?.actSetModalPriceCheckingOpen(true);
  };

  const onOpenModalMarketcapChecking = () => {
    props?.actSetModalMarketcapCheckingOpen(true);
  };

  return (
    <MenuWrapper>
      <ControlledMenu
        {...menuProps}
        anchorPoint={anchorPoint}
        direction="right"
        onClose={() => toggleMenu(false)}
      >
        {selectedEdgeID === null && (
          <MenuItem onClick={onRun}>
            <MenuItemWrapper>
              <div className="icon">
                <PlayIcon color="var(--color-success)" />
              </div>
              <div className="label">Enable</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        {selectedEdgeID === null && (
          <MenuItem onClick={onStop}>
            <MenuItemWrapper>
              <div className="icon" style={{ transform: "scale(0.9)" }}>
                <StopIcon color="var(--color-error)" />
              </div>
              <div className="label">Disable</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        {(selectedEdgeID !== null || selectedNodeID !== null) && (
          <MenuItem onClick={onOpenModalQueueData}>
            <MenuItemWrapper>
              <div className="icon">
                <EyeOpenIcon color="var(--color-text-secondary)" />
              </div>
              <div className="label">{translate("workflow.viewQueue")}</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        {selectedNodeID === null && (
          <MenuItem>
            <MenuItemWrapper>
              <div className="icon">
                <BroomIcon color="var(--color-text-secondary)" />
              </div>
              <div className="label">{translate("workflow.clearQueue")}</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        <MenuItem onClick={() => onLayout(LayoutDirection.HORIZONTAL)}>
          <MenuItemWrapper>
            <div className="icon">
              <HorizontalIcon color="var(--color-text-secondary)" />
            </div>
            <div className="label">
              {translate("workflow.autoLayoutHorizontal")}
            </div>
          </MenuItemWrapper>
        </MenuItem>

        <MenuItem onClick={() => onLayout(LayoutDirection.VERTICAL)}>
          <MenuItemWrapper>
            <div className="icon">
              <VerticalIcon color="var(--color-text-secondary)" />
            </div>
            <div className="label">
              {translate("workflow.autoLayoutVertical")}
            </div>
          </MenuItemWrapper>
        </MenuItem>

        {selectedNodeID !== null && selectedEdgeID === null && (
          <MenuItem onClick={onDuplicateNode}>
            <MenuItemWrapper>
              <div className="icon">
                <CopyBoldIcon color="var(--color-text-secondary)" />
              </div>
              <div className="label">{translate("workflow.duplicate")}</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        {selectedNodeID !== null && (
          <MenuItem onClick={onOpenModalNodeConfig}>
            <MenuItemWrapper>
              <div className="icon">
                <GearIcon color="var(--color-text-secondary)" />
              </div>
              <div className="label">{translate("workflow.config")}</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        {selectedNodeID !== null && (
          <MenuItem onClick={onOpenModalInstruction}>
            <MenuItemWrapper>
              <div className="icon">
                <BookBoldIcon color="var(--color-text-secondary)" />
              </div>
              <div className="label">{translate("guide")}</div>
            </MenuItemWrapper>
          </MenuItem>
        )}

        {selectedNodeID !== null &&
          selectedWorkflowType === WORKFLOW_TYPE.EVM_SNIPE_CONTRACT && (
            <MenuItem onClick={onOpenModalViewContractSniperResult}>
              <MenuItemWrapper>
                <div className="icon">
                  <CameraIcon color="var(--color-text-secondary)" />
                </div>
                <div className="label">
                  {translate("workflow.viewContractEvent")}
                </div>
              </MenuItemWrapper>
            </MenuItem>
          )}

        {selectedNodeID !== null &&
          selectedWorkflowType === WORKFLOW_TYPE.CHECK_TOKEN_PRICE && (
            <MenuItem onClick={onOpenModalPriceChecking}>
              <MenuItemWrapper>
                <div className="icon">
                  <PaperIcon color="var(--color-text-secondary)" />
                </div>
                <div className="label">
                  {translate("workflow.viewTokenPrice")}
                </div>
              </MenuItemWrapper>
            </MenuItem>
          )}

        {selectedNodeID !== null &&
          selectedWorkflowType === WORKFLOW_TYPE.CHECK_MARKETCAP && (
            <MenuItem onClick={onOpenModalMarketcapChecking}>
              <MenuItemWrapper>
                <div className="icon">
                  <GrowthIcon color="var(--color-text-secondary)" />
                </div>
                <div className="label">
                  {translate("workflow.viewMarketcap")}
                </div>
              </MenuItemWrapper>
            </MenuItem>
          )}
      </ControlledMenu>
    </MenuWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
    selectedEdgeID: state?.WorkflowRunner?.selectedEdgeID,
    selectedWorkflowType: state?.WorkflowRunner?.selectedWorkflowType,
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes || [],
  }),
  {
    actSetModalOpen,
    actSetModalQueueOpen,
    actSetShowModalInstruction,
    actSetSelectedWorkflowType,
    actSetModalSampleContractSniperResultOpen,
    actSetModalPriceCheckingOpen,
    actSetModalMarketcapCheckingOpen,
  },
)(ContextMenu);
