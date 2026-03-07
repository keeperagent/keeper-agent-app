import { useMemo, useEffect } from "react";
import { Modal } from "antd";
import _ from "lodash";
import { connect } from "react-redux";
import { Node } from "@xyflow/react";
import { RootState } from "@/redux/store";
import { actSetModalOpen, actSetNodes } from "@/redux/workflowRunner";
import { INodeConfig, IWorkflow } from "@/electron/type";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { ModalWrapper } from "./style";
import OpenUrl from "./OpenUrl";
import TypeText from "./TypeText";
import Click from "./Click";
import MetamaskImportWallet from "./MetamaskImportWallet";
import MetamaskUnlockWallet from "./MetamaskUnlockWallet";
import MetamaskConnect from "./MetamaskConnect";
import MetamaskApprove from "./MetamaskApprove";
import MetamaskCancel from "./MetamaskCancel";
import MetamaskConfirm from "./MetamaskConfirm";
import SolveCaptcha from "./SolveCaptcha";
import SwitchWindow from "./SwitchWindow";
import ReloadPage from "./Reload";
import GoBack from "./GoBack";
import SelectTab from "./SelectTab";
import CloseTab from "./CloseTab";
import OpenNewTab from "./OpenNewTab";
import Scroll from "./Scroll";
import GetWalletBalance from "./GetWalletBalance";
import Loop from "./Loop";
import GenerateProfile from "./GenerateProfile";
import SetAttribute from "./SetAttribute";
import CrawlText from "./CrawlText";
import TwitterLogin from "./TwitterLogin";
import SaveWallet from "./SaveWallet";
import SaveResource from "./SaveResource";
import GetGasPrice from "./GetGasPrice";
import CheckCondition from "./CheckCondition";
import GetRandomValue from "./GetRandomValue";
import RabbyWalletImportWallet from "./RabbyWalletImport";
import RabbyWalletConnect from "./RabbyWalletConnect";
import RabbyWalletUnlock from "./RabbyWalletUnlock";
import RabbyWalletCancel from "./RabbyWalletCancel";
import RabbyWalletSign from "./RabbyWalletSign";
import RabbyAddNetwork from "./RabbyAddNetwork";
import CheckElementExist from "./CheckElementExist";
import RandomOnOff from "./RandomOnOff";
import Calculate from "./Calculate";
import UpdateProfile from "./UpdateProfile";
import SaveLog from "./SaveLog";
import MartianWalletImport from "./MartianWalletImport";
import MartianWalletApprove from "./MartianWalletApprove";
import MartianWalletUnlock from "./MartianWalletUnlock";
import MartianWalletSwitch from "./MartianWalletSwitch";
import TelegramBotMessage from "./TelegramBotMessage";
import SnipeTelegram from "./SnipeTelegram";
import SelectToken from "./SelectToken";
import SelectChain from "./SelectChain";
import TwitterFollow from "./TwitterFollow";
import TwitterLike from "./TwitterLike";
import TwitterReTweet from "./TwitterReTweet";
import TwitterReplyTweet from "./TwitterReplyTweet";
import PhantomWalletImport from "./PhantomWalletImport";
import PhantomWalletUnlock from "./PhantomWalletUnlock";
import ExecuteCode from "./ExecuteCode";
import OnOffProfile from "./OnOffProfile";
import PhantomWalletConnect from "./PhantomWalletConnect";
import PhantomWalletClickConfirm from "./PhantomWalletClickConfirm";
import TransferToken from "./TransferToken";
import ApproveRevokeEVM from "./ApproveRevokeEVM";
import SwapUniswap from "./SwapUniswap";
import GetTokenPrice from "./GetTokenPrice";
import SnipeContractEVM from "./SnipeContractEVM";
import ConvertTokenAmount from "./ConvertTokenAmount";
import SelectWallet from "./SelectWallet";
import SelectResource from "./SelectResource";
import ReadContractEVM from "./ReadContractEVM";
import WriteToContractEVM from "./WriteToContractEVM";
import HttpRequest from "./HttpRequest";
import SwapCetus from "./SwapCetus";
import CheckTokenPrice from "./CheckTokenPrice";
import CheckMarketcap from "./CheckMarketcap";
import GetPriorityFee from "./GetPriorityFee";
import GenerateVanityAddress from "./GenerateVanityAddress";
import SwapKyberswap from "./SwapKyberswap";
import ExecuteTransaction from "./ExecuteTransaction";
import SwapJupiter from "./SwapJupiter";
import StopWorkflow from "./StopWorkflow";
import LaunchTokenPumpfun from "./LaunchTokenPumpfun";
import LaunchTokenBonkfun from "./LaunchTokenBonkfun";
import AskAgent from "./AskAgent";
import GenerateImage from "./GenerateImage";

type IModalProps = {
  isModalOpen: boolean;
  actSetModalOpen: (payload: boolean) => void;
  actSetNodes: (payload: { nodes: Node[]; saveHistory: boolean }) => void;
  nodes: Node[];
  selectedNodeID: string | null;
  selectedWorkflowType: string | null;
  selectedWorkflow: IWorkflow | null;
};

const ModalNodeConfig = (props: IModalProps) => {
  const {
    isModalOpen,
    nodes,
    selectedNodeID,
    selectedWorkflowType,
    selectedWorkflow,
  } = props;
  const { translate } = useTranslation();

  const selectedNode: any = useMemo(() => {
    return _.find(nodes, { id: selectedNodeID });
  }, [selectedNodeID, nodes]);

  useEffect(() => {
    if (!selectedNode) {
      onCloseModal();
    }
  }, [selectedNode]);

  const onCloseModal = () => {
    props?.actSetModalOpen(false);
  };

  const onSaveNodeConfig = (config: INodeConfig) => {
    const selectedNodeID = selectedNode?.id;
    if (selectedNodeID === null) {
      return;
    }

    const newNodes = nodes.map((node: Node) => {
      let newNode = node;
      if (newNode?.id === selectedNodeID) {
        const newNodeData = {
          ...node.data,
          config: {
            ...(node?.data?.config as INodeConfig),
            ...config,
          },
        };
        newNode = { ...newNode, data: newNodeData };
      }

      return newNode;
    });
    props?.actSetNodes({ nodes: newNodes, saveHistory: true });
  };

  const propsNodeConfig = {
    onCloseModal: onCloseModal,
    onSaveNodeConfig: onSaveNodeConfig,
    config: selectedNode?.data?.config,
    isModalOpen: isModalOpen,
    nodeId: selectedNode?.id || "",
    workflowId: selectedWorkflow?.id || 0,
  };

  const renderNodeElement = () => {
    switch (selectedWorkflowType) {
      case WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN:
        return <LaunchTokenPumpfun {...propsNodeConfig} />;

      case WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN:
        return <LaunchTokenBonkfun {...propsNodeConfig} />;

      case WORKFLOW_TYPE.ASK_AGENT:
        return <AskAgent {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GENERATE_IMAGE:
        return <GenerateImage {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SWAP_UNISWAP:
        return <SwapUniswap {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SWAP_JUPITER:
        return <SwapJupiter {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SWAP_CETUS:
        return <SwapCetus {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SWAP_PANCAKESWAP:
        return <SwapUniswap {...propsNodeConfig} isPancakeswap={true} />;

      case WORKFLOW_TYPE.SWAP_KYBERSWAP:
        return <SwapKyberswap {...propsNodeConfig} />;

      case WORKFLOW_TYPE.IMPORT_METAMASK_WALLET:
        return <MetamaskImportWallet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET:
        return <MetamaskUnlockWallet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CONNECT_METAMASK_WALLET:
        return <MetamaskConnect {...propsNodeConfig} />;

      case WORKFLOW_TYPE.APPROVE_METAMASK_WALLET:
        return <MetamaskApprove {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CANCEL_METAMASK_WALLET:
        return <MetamaskCancel {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET:
        return <MetamaskConfirm {...propsNodeConfig} />;

      case WORKFLOW_TYPE.IMPORT_RABBY_WALLET:
        return <RabbyWalletImportWallet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.UNLOCK_RABBY_WALLET:
        return <RabbyWalletUnlock {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CONNECT_RABBY_WALLET:
        return <RabbyWalletConnect {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CANCEL_RABBY_WALLET:
        return <RabbyWalletCancel {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SIGN_RABBY_WALLET:
        return <RabbyWalletSign {...propsNodeConfig} />;

      case WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET:
        return <RabbyAddNetwork {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GET_WALLET_BALANCE:
        return <GetWalletBalance {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SOLVE_CAPTCHA:
        return <SolveCaptcha {...propsNodeConfig} />;

      case WORKFLOW_TYPE.OPEN_URL:
        return <OpenUrl {...propsNodeConfig} />;

      case WORKFLOW_TYPE.TYPE_TEXT:
        return <TypeText {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CLICK:
        return <Click {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SWITCH_WINDOW:
        return <SwitchWindow {...propsNodeConfig} />;

      case WORKFLOW_TYPE.RELOAD_PAGE:
        return <ReloadPage {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GO_BACK:
        return <GoBack {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CLOSE_TAB:
        return <CloseTab {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SELECT_TAB:
        return <SelectTab {...propsNodeConfig} />;

      case WORKFLOW_TYPE.NEW_TAB:
        return <OpenNewTab {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SCROLL:
        return <Scroll {...propsNodeConfig} />;

      case WORKFLOW_TYPE.LOOP:
        return <Loop {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GENERATE_PROFILE:
        return <GenerateProfile {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SET_ATTRIBUTE:
        return <SetAttribute {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CRAWL_TEXT:
        return <CrawlText {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SAVE_WALLET:
        return <SaveWallet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SAVE_RESOURCE:
        return <SaveResource {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GET_GAS_PRICE:
        return <GetGasPrice {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GET_PRIORITY_FEE:
        return <GetPriorityFee {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS:
        return <GenerateVanityAddress {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CHECK_CONDITION:
        return <CheckCondition {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GET_RANDOM_VALUE:
        return <GetRandomValue {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CHECK_ELEMENT_EXIST:
        return <CheckElementExist {...propsNodeConfig} />;

      case WORKFLOW_TYPE.RANDOM_ON_OFF:
        return <RandomOnOff {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CALCULATE:
        return <Calculate {...propsNodeConfig} />;

      case WORKFLOW_TYPE.UPDATE_PROFILE:
        return <UpdateProfile {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SAVE_LOG:
        return <SaveLog {...propsNodeConfig} />;

      case WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET:
        return <MartianWalletImport {...propsNodeConfig} />;

      case WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET:
        return <MartianWalletApprove {...propsNodeConfig} />;

      case WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET:
        return <MartianWalletUnlock {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET:
        return <MartianWalletSwitch {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SEND_TELEGRAM:
        return <TelegramBotMessage {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SNIPE_TELEGRAM:
        return <SnipeTelegram {...propsNodeConfig} />;

      case WORKFLOW_TYPE.LOGIN_TWITTER:
        return <TwitterLogin {...propsNodeConfig} />;

      case WORKFLOW_TYPE.FOLLOW_TWITTER:
        return <TwitterFollow {...propsNodeConfig} />;

      case WORKFLOW_TYPE.LIKE_TWITTER:
        return <TwitterLike {...propsNodeConfig} />;

      case WORKFLOW_TYPE.RETWEET_TWITTER:
        return <TwitterReTweet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.REPLY_TWITTER:
        return <TwitterReplyTweet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET:
        return <PhantomWalletImport {...propsNodeConfig} />;

      case WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET:
        return <PhantomWalletUnlock {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET:
        return <PhantomWalletConnect {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET:
        return <PhantomWalletClickConfirm {...propsNodeConfig} />;

      case WORKFLOW_TYPE.TRANSFER_TOKEN:
        return <TransferToken {...propsNodeConfig} />;

      case WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN:
        return <ApproveRevokeEVM {...propsNodeConfig} />;

      case WORKFLOW_TYPE.EXECUTE_CODE:
        return <ExecuteCode {...propsNodeConfig} />;

      case WORKFLOW_TYPE.ON_OFF_PROFILE:
        return <OnOffProfile {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SELECT_WALLET:
        return <SelectWallet {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CHECK_RESOURCE:
        return <SelectResource {...propsNodeConfig} />;

      case WORKFLOW_TYPE.GET_TOKEN_PRICE:
        return <GetTokenPrice {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CHECK_TOKEN_PRICE:
        return <CheckTokenPrice {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CHECK_MARKETCAP:
        return <CheckMarketcap {...propsNodeConfig} />;

      case WORKFLOW_TYPE.EVM_SNIPE_CONTRACT:
        return <SnipeContractEVM {...propsNodeConfig} />;

      case WORKFLOW_TYPE.EXECUTE_TRANSACTION:
        return <ExecuteTransaction {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SELECT_TOKEN:
        return <SelectToken {...propsNodeConfig} />;

      case WORKFLOW_TYPE.SELECT_CHAIN:
        return <SelectChain {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT:
        return <ConvertTokenAmount {...propsNodeConfig} />;

      case WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT:
        return <ReadContractEVM {...propsNodeConfig} />;

      case WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT:
        return <WriteToContractEVM {...propsNodeConfig} />;

      case WORKFLOW_TYPE.HTTP_REQUEST:
        return <HttpRequest {...propsNodeConfig} />;

      case WORKFLOW_TYPE.STOP_SCRIPT:
        return <StopWorkflow {...propsNodeConfig} />;

      default:
        return null;
    }
  };

  return (
    <Modal
      destroyOnHidden={false}
      open={isModalOpen}
      okText={translate("button.update")}
      cancelText={translate("cancel")}
      title={translate("workflow.config")}
      width="55rem"
      onCancel={onCloseModal}
      footer={null}
      style={{ top: "5rem" }}
      maskClosable={false}
    >
      <ModalWrapper>{renderNodeElement()}</ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalOpen: state?.WorkflowRunner?.isModalOpen,
    selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
    selectedWorkflowType: state?.WorkflowRunner?.selectedWorkflowType,
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes || [],
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  { actSetModalOpen, actSetNodes },
)(ModalNodeConfig);
