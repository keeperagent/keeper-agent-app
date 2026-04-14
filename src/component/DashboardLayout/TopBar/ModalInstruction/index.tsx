import { useEffect } from "react";
import qs from "qs";
import { Modal } from "antd";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "@/redux/store";
import {
  actSetModalInstructionOpen,
  actSetReadCampaignInstruction,
  actSetReadNodeProviderInstruction,
  actSetReadWalletInstruction,
  actSetReadResourceInstruction,
  actSetReadProfileInstruction,
  actSetReadWorkflowInstruction,
  actSetReadProxyInstruction,
  actSetReadExtensionInstruction,
  actSetReadHistoryInstruction,
  actSetReadScheduleInstruction,
} from "@/redux/layout";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import CampaignInstruction from "./CampaignInstruction";
import NodeProviderInstruction from "./NodeProviderInstruction";
import WalletInstruction from "./WalletInstruction";
import ResourceInstruction from "./ResourceInstruction";
import ProfileInstruction from "./ProfileInstruction";
import WorkflowInstruction from "./WorkflowInstruction";
import ProxyInstruction from "./ProxyInstruction";
import ExtensionInstruction from "./ExtensionInstruction";
import HistoryInstruction from "./HistoryInstruction";
import ScheduleInstruction from "./ScheduleInstruction";

type IProps = {
  isModalInstructionOpen: boolean;
  isReadCampaignInstruction: boolean;
  isReadNodeProviderInstruction: boolean;
  isReadWalletInstruction: boolean;
  isReadResourceInstruction: boolean;
  isReadProfileInstruction: boolean;
  isReadWorkflowInstruction: boolean;
  isReadProxyInstruction: boolean;
  isReadExtensionInstruction: boolean;
  isReadHistoryInstruction: boolean;
  actSetModalInstructionOpen: (payload: boolean) => void;
  actSetReadCampaignInstruction: (payload: boolean) => void;
  actSetReadNodeProviderInstruction: (payload: boolean) => void;
  actSetReadWalletInstruction: (payload: boolean) => void;
  actSetReadResourceInstruction: (payload: boolean) => void;
  actSetReadProfileInstruction: (payload: boolean) => void;
  actSetReadWorkflowInstruction: (payload: boolean) => void;
  actSetReadProxyInstruction: (payload: boolean) => void;
  actSetReadExtensionInstruction: (payload: boolean) => void;
  actSetReadHistoryInstruction: (payload: boolean) => void;
  actSetReadScheduleInstruction: (payload: boolean) => void;
};

const ModalInstruction = (props: IProps) => {
  const {
    isModalInstructionOpen,
    isReadCampaignInstruction,
    isReadNodeProviderInstruction,
    isReadWalletInstruction,
    isReadResourceInstruction,
    isReadProfileInstruction,
    isReadWorkflowInstruction,
    isReadProxyInstruction,
    isReadExtensionInstruction,
    isReadHistoryInstruction,
  } = props;
  const { pathname, search } = useLocation();
  const { tab } = qs.parse(search, { ignoreQueryPrefix: true });
  const { translate } = useTranslation();

  useEffect(() => {
    switch (pathname) {
      case "/dashboard/campaign":
        if (!isReadCampaignInstruction) {
          props?.actSetModalInstructionOpen(true);
        }
        break;
      case "/dashboard/connections":
        if (tab === "node-provider" && !isReadNodeProviderInstruction) {
          props?.actSetModalInstructionOpen(true);
        } else if (tab === "extension" && !isReadExtensionInstruction) {
          props?.actSetModalInstructionOpen(true);
        } else if ((!tab || tab === "proxy") && !isReadProxyInstruction) {
          props?.actSetModalInstructionOpen(true);
        }
        break;
      case "/dashboard/wallet":
        if (!isReadWalletInstruction) {
          props?.actSetModalInstructionOpen(true);
        }
        break;
      case "/dashboard/resource":
        if (!isReadResourceInstruction) {
          props?.actSetModalInstructionOpen(true);
        }
        break;
      case "/dashboard/profile":
        if (!isReadProfileInstruction) {
          props?.actSetModalInstructionOpen(true);
        }
        break;
      case "/dashboard/workflow":
        if (!isReadWorkflowInstruction) {
          props?.actSetModalInstructionOpen(true);
        }
        break;

      case "/dashboard/history":
        if (!isReadHistoryInstruction) {
          props?.actSetReadHistoryInstruction(true);
        }
        break;
      case "/dashboard/schedule":
        if (!isReadHistoryInstruction) {
          props?.actSetReadHistoryInstruction(true);
        }
        break;
    }
  }, [
    isReadCampaignInstruction,
    isReadNodeProviderInstruction,
    isReadWalletInstruction,
    isReadResourceInstruction,
    isReadProfileInstruction,
    isReadWorkflowInstruction,
    isReadProxyInstruction,
    isReadExtensionInstruction,
    isReadHistoryInstruction,
    isReadHistoryInstruction,
    pathname,
  ]);

  const onCloseModal = () => {
    props?.actSetModalInstructionOpen(false);

    switch (pathname) {
      case "/dashboard/campaign":
        props?.actSetReadCampaignInstruction(true);
        break;
      case "/dashboard/connections":
        if (tab === "node-provider") {
          props?.actSetReadNodeProviderInstruction(true);
        } else if (tab === "extension") {
          props?.actSetReadExtensionInstruction(true);
        } else {
          props?.actSetReadProxyInstruction(true);
        }
        break;
      case "/dashboard/wallet":
        props?.actSetReadWalletInstruction(true);
        break;
      case "/dashboard/resource":
        props?.actSetReadResourceInstruction(true);
        break;
      case "/dashboard/profile":
        props?.actSetReadProfileInstruction(true);
        break;
      case "/dashboard/workflow":
        props?.actSetReadWorkflowInstruction(true);
        break;
      case "/dashboard/history":
        props?.actSetReadHistoryInstruction(true);
        break;
      case "/dashboard/schedule":
        props?.actSetReadScheduleInstruction(true);
        break;
    }
  };

  const renderContent = () => {
    switch (pathname) {
      case "/dashboard/campaign":
        return <CampaignInstruction />;
      case "/dashboard/connections":
        if (tab === "node-provider") {
          return <NodeProviderInstruction />;
        }
        if (tab === "extension") {
          return <ExtensionInstruction />;
        }
        return <ProxyInstruction />;
      case "/dashboard/wallet":
        return <WalletInstruction />;
      case "/dashboard/resource":
        return <ResourceInstruction />;
      case "/dashboard/profile":
        return <ProfileInstruction />;
      case "/dashboard/workflow":
        return <WorkflowInstruction />;
      case "/dashboard/history":
        return <HistoryInstruction />;
      case "/dashboard/schedule":
        return <ScheduleInstruction />;
      default:
        return null;
    }
  };

  return (
    <Modal
      open={isModalInstructionOpen}
      onCancel={onCloseModal}
      title={translate("guide")}
      width="95rem"
      style={{ top: "6rem" }}
      onOk={onCloseModal}
      footer={null}
    >
      <Wrapper>{renderContent()}</Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalInstructionOpen: state?.Layout?.isModalInstructionOpen,
    isReadCampaignInstruction: state?.Layout?.isReadCampaignInstruction,
    isReadNodeProviderInstruction: state?.Layout?.isReadNodeProviderInstruction,
    isReadWalletInstruction: state?.Layout?.isReadWalletInstruction,
    isReadResourceInstruction: state?.Layout?.isReadResourceInstruction,
    isReadProfileInstruction: state?.Layout?.isReadProfileInstruction,
    isReadWorkflowInstruction: state?.Layout?.isReadWorkflowInstruction,
    isReadProxyInstruction: state?.Layout?.isReadProxyInstruction,
    isReadExtensionInstruction: state?.Layout?.isReadExtensionInstruction,
    isReadHistoryInstruction: state?.Layout?.isReadHistoryInstruction,
  }),
  {
    actSetModalInstructionOpen,
    actSetReadCampaignInstruction,
    actSetReadNodeProviderInstruction,
    actSetReadWalletInstruction,
    actSetReadResourceInstruction,
    actSetReadProfileInstruction,
    actSetReadWorkflowInstruction,
    actSetReadProxyInstruction,
    actSetReadExtensionInstruction,
    actSetReadHistoryInstruction,
    actSetReadScheduleInstruction,
  },
)(ModalInstruction);
