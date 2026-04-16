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
import { ModalWrapper } from "./common/sharedStyle";
import OpenUrl from "./browser/OpenUrl";
import TypeText from "./browser/TypeText";
import Click from "./browser/Click";
import MetamaskImportWallet from "./wallet/MetamaskImportWallet";
import MetamaskUnlockWallet from "./wallet/MetamaskUnlockWallet";
import MetamaskConnect from "./wallet/MetamaskConnect";
import MetamaskApprove from "./wallet/MetamaskApprove";
import MetamaskCancel from "./wallet/MetamaskCancel";
import MetamaskConfirm from "./wallet/MetamaskConfirm";
import SolveCaptcha from "./browser/SolveCaptcha";
import SwitchWindow from "./browser/SwitchWindow";
import ReloadPage from "./browser/Reload";
import GoBack from "./browser/GoBack";
import SelectTab from "./browser/SelectTab";
import CloseTab from "./browser/CloseTab";
import OpenNewTab from "./browser/OpenNewTab";
import Scroll from "./browser/Scroll";
import GetWalletBalance from "./onchain/GetWalletBalance";
import Loop from "./flow/Loop";
import GenerateProfile from "./other/GenerateProfile";
import SetAttribute from "./browser/SetAttribute";
import CrawlText from "./browser/CrawlText";
import TwitterLogin from "./social/TwitterLogin";
import SaveWallet from "./other/SaveWallet";
import SaveResource from "./other/SaveResource";
import GetGasPrice from "./onchain/GetGasPrice";
import CheckCondition from "./flow/CheckCondition";
import GetRandomValue from "./flow/GetRandomValue";
import RabbyWalletImportWallet from "./wallet/RabbyWalletImport";
import RabbyWalletConnect from "./wallet/RabbyWalletConnect";
import RabbyWalletUnlock from "./wallet/RabbyWalletUnlock";
import RabbyWalletCancel from "./wallet/RabbyWalletCancel";
import RabbyWalletSign from "./wallet/RabbyWalletSign";
import RabbyAddNetwork from "./wallet/RabbyAddNetwork";
import CheckElementExist from "./browser/CheckElementExist";
import RandomOnOff from "./flow/RandomOnOff";
import Calculate from "./flow/Calculate";
import UpdateProfile from "./other/UpdateProfile";
import SaveLog from "./other/SaveLog";
import MartianWalletImport from "./wallet/MartianWalletImport";
import MartianWalletApprove from "./wallet/MartianWalletApprove";
import MartianWalletUnlock from "./wallet/MartianWalletUnlock";
import MartianWalletSwitch from "./wallet/MartianWalletSwitch";
import TelegramBotMessage from "./social/TelegramBotMessage";
import SnipeTelegram from "./social/SnipeTelegram";
import SelectToken from "./onchain/SelectToken";
import SelectChain from "./onchain/SelectChain";
import TwitterFollow from "./social/TwitterFollow";
import TwitterLike from "./social/TwitterLike";
import TwitterReTweet from "./social/TwitterReTweet";
import TwitterReplyTweet from "./social/TwitterReplyTweet";
import PhantomWalletImport from "./wallet/PhantomWalletImport";
import PhantomWalletUnlock from "./wallet/PhantomWalletUnlock";
import ExecuteCode from "./other/ExecuteCode";
import OnOffProfile from "./other/OnOffProfile";
import PhantomWalletConnect from "./wallet/PhantomWalletConnect";
import PhantomWalletClickConfirm from "./wallet/PhantomWalletClickConfirm";
import TransferToken from "./onchain/TransferToken";
import ApproveRevokeEVM from "./onchain/ApproveRevokeEVM";
import SwapUniswap from "./onchain/SwapUniswap";
import GetTokenPrice from "./onchain/GetTokenPrice";
import SnipeContractEVM from "./onchain/SnipeContractEVM";
import ConvertTokenAmount from "./onchain/ConvertTokenAmount";
import SelectWallet from "./wallet/SelectWallet";
import SelectResource from "./other/SelectResource";
import ReadContractEVM from "./onchain/ReadContractEVM";
import WriteToContractEVM from "./onchain/WriteToContractEVM";
import HttpRequest from "./other/HttpRequest";
import SwapCetus from "./onchain/SwapCetus";
import CheckTokenPrice from "./onchain/CheckTokenPrice";
import CheckMarketcap from "./flow/CheckMarketcap";
import GetPriorityFee from "./onchain/GetPriorityFee";
import GenerateVanityAddress from "./onchain/GenerateVanityAddress";
import SwapKyberswap from "./onchain/SwapKyberswap";
import ExecuteTransaction from "./onchain/ExecuteTransaction";
import SwapJupiter from "./onchain/SwapJupiter";
import StopWorkflow from "./flow/StopWorkflow";
import LaunchTokenPumpfun from "./onchain/LaunchTokenPumpfun";
import LaunchTokenBonkfun from "./onchain/LaunchTokenBonkfun";
import GenerateImage from "./browser/GenerateImage";
import RunAgent from "./flow/RunAgent";
import ClickExtension from "./browser/ClickExtension";
import UploadFile from "./browser/UploadFile";
import Debate from "./flow/Debate";
import Checkpoint from "./flow/Checkpoint";

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

      case WORKFLOW_TYPE.GENERATE_IMAGE:
        return <GenerateImage {...propsNodeConfig} />;

      case WORKFLOW_TYPE.RUN_AGENT:
        return <RunAgent {...propsNodeConfig} />;

      case WORKFLOW_TYPE.DEBATE:
        return <Debate {...propsNodeConfig} />;

      case WORKFLOW_TYPE.CLICK_EXTENSION:
        return <ClickExtension {...propsNodeConfig} />;

      case WORKFLOW_TYPE.UPLOAD_FILE:
        return <UploadFile {...propsNodeConfig} />;

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

      case WORKFLOW_TYPE.CHECKPOINT:
        return <Checkpoint {...propsNodeConfig} />;

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
      mask={{ closable: true }}
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
