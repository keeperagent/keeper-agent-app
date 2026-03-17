import { ReactElement } from "react";
import {
  LinkIcon,
  ReloadIcon,
  BackIcon,
  WindowIcon,
  PointerIcon,
  FingerIcon,
  CloseCircleIcon,
  LetterIcon,
  CodeIcon,
  SortIcon,
  PopupIcon,
  CheckCircleIcon,
  WalletIcon,
  ShuffleIcon,
  CommentIcon,
  MixIcon,
  LayerPlusIcon,
  BugIcon,
  PuzzleIcon,
  ObjectGroupIcon,
  GasIcon,
  CompareIcon,
  DiceIcon,
  CookieIcon,
  ToggleIcon,
  CalculatorIcon,
  RocketIcon,
  LookupIcon,
  SliderIcon,
  NetworkCircleIcon,
  SensorIcon,
  TransferIcon,
  ApproveIcon,
  PriceCryptoIcon,
  CameraIcon,
  ConvertIcon,
  WalletArrowIcon,
  ObjectUnGroupIcon,
  StoryBookIcon,
  DocumentStoryIcon,
  NetworkIcon,
  PaperIcon,
  GrowthIcon,
  PriorityIcon,
  BarcodeIcon,
  StopCircle,
  MiningIcon,
  AgentIcon,
  ImageIcon,
  SettingWindowIcon,
} from "@/component/Icon";
import metamaskImg from "@/asset/metamask.png";
import twitterImg from "@/asset/twitter.png";
import telegramImg from "@/asset/telegram.png";
import martianWalletImg from "@/asset/martian.png";
import rabbyWalletImg from "@/asset/rabby-wallet.png";
import phantomWalletImg from "@/asset/phantom.png";
import uniswapImg from "@/asset/uniswap.png";
import pancakeswapImg from "@/asset/pancakeswap.png";
import cetusImg from "@/asset/cetus.webp";
import kyberswapImg from "@/asset/kyberswap.webp";
import jupiterImg from "@/asset/jupiter.webp";
import pumpfunImg from "@/asset/pumpfun.png";
import bonkfunImg from "@/asset/bonkfun.png";
import {
  SCRIPT_NAME_EN,
  NODE_CATEGORY_LABEL_EN,
  DEFAULT_SLEEP_TIME,
} from "@/config/constant";
import {
  IMPORT_WALLET_TYPE,
  WALLET_VARIABLE,
  WORKFLOW_TYPE,
  NODE_STATUS,
  NODE_TYPE,
} from "@/electron/constant";
import { DEFAULT_EXTENSION_TIMEOUT } from "@/electron/simulator/constant";
import { INode, commonNodeConfig } from "./common";
import { NodeIconWrapper } from "./style";

export const mapNodeIcon: { [key: string]: ReactElement } = {
  [WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN]: (
    <NodeIconWrapper>
      <img src={pumpfunImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN]: (
    <NodeIconWrapper>
      <img src={bonkfunImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.ASK_AGENT]: <AgentIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.GENERATE_IMAGE]: <ImageIcon color="var(--color-primary)" />,

  [WORKFLOW_TYPE.SWAP_UNISWAP]: (
    <NodeIconWrapper className="large">
      <img src={uniswapImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.SWAP_PANCAKESWAP]: (
    <NodeIconWrapper className="large">
      <img src={pancakeswapImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.SWAP_CETUS]: (
    <NodeIconWrapper className="large">
      <img src={cetusImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.SWAP_KYBERSWAP]: (
    <NodeIconWrapper className="large">
      <img src={kyberswapImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.SWAP_JUPITER]: (
    <NodeIconWrapper className="large">
      <img src={jupiterImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.GET_WALLET_BALANCE]: (
    <PuzzleIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.TRANSFER_TOKEN]: <TransferIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN]: (
    <ApproveIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]: (
    <CameraIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT]: (
    <StoryBookIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT]: (
    <DocumentStoryIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.EXECUTE_TRANSACTION]: (
    <BarcodeIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT]: (
    <ConvertIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.GET_GAS_PRICE]: <GasIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.GET_PRIORITY_FEE]: (
    <PriorityIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS]: (
    <MiningIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.GET_TOKEN_PRICE]: (
    <PriceCryptoIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.CHECK_TOKEN_PRICE]: <PaperIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CHECK_MARKETCAP]: <GrowthIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SELECT_TOKEN]: <SliderIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SELECT_CHAIN]: (
    <NetworkCircleIcon color="var(--color-primary)" />
  ),

  [WORKFLOW_TYPE.OPEN_URL]: <LinkIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SWITCH_WINDOW]: <PopupIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.TYPE_TEXT]: <LetterIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CLICK]: <PointerIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.NEW_TAB]: <WindowIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SELECT_TAB]: <FingerIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CLOSE_TAB]: <CloseCircleIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.GO_BACK]: <BackIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.RELOAD_PAGE]: <ReloadIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SCROLL]: <SortIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.COMMENT]: <CommentIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.GENERATE_PROFILE]: <MixIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SET_ATTRIBUTE]: <LayerPlusIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CRAWL_TEXT]: <BugIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CHECK_CONDITION]: <CompareIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CHECK_ELEMENT_EXIST]: (
    <CookieIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.CLICK_EXTENSION]: (
    <SettingWindowIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.GET_RANDOM_VALUE]: <DiceIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.RANDOM_ON_OFF]: <ToggleIcon color="var(--color-primary)" />,

  [WORKFLOW_TYPE.IMPORT_METAMASK_WALLET]: (
    <NodeIconWrapper>
      <img src={metamaskImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET]: (
    <NodeIconWrapper>
      <img src={metamaskImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.APPROVE_METAMASK_WALLET]: (
    <NodeIconWrapper>
      <img src={metamaskImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CONNECT_METAMASK_WALLET]: (
    <NodeIconWrapper>
      <img src={metamaskImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET]: (
    <NodeIconWrapper>
      <img src={metamaskImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CANCEL_METAMASK_WALLET]: (
    <NodeIconWrapper>
      <img src={metamaskImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET]: (
    <NodeIconWrapper>
      <img src={martianWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET]: (
    <NodeIconWrapper>
      <img src={martianWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET]: (
    <NodeIconWrapper>
      <img src={martianWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET]: (
    <NodeIconWrapper>
      <img src={martianWalletImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.IMPORT_RABBY_WALLET]: (
    <NodeIconWrapper>
      <img src={rabbyWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.UNLOCK_RABBY_WALLET]: (
    <NodeIconWrapper>
      <img src={rabbyWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CONNECT_RABBY_WALLET]: (
    <NodeIconWrapper>
      <img src={rabbyWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.SIGN_RABBY_WALLET]: (
    <NodeIconWrapper>
      <img src={rabbyWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CANCEL_RABBY_WALLET]: (
    <NodeIconWrapper>
      <img src={rabbyWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET]: (
    <NodeIconWrapper>
      <img src={rabbyWalletImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET]: (
    <NodeIconWrapper>
      <img src={phantomWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET]: (
    <NodeIconWrapper>
      <img src={phantomWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET]: (
    <NodeIconWrapper>
      <img src={phantomWalletImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET]: (
    <NodeIconWrapper>
      <img src={phantomWalletImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.LOGIN_TWITTER]: (
    <NodeIconWrapper className="large">
      <img src={twitterImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.FOLLOW_TWITTER]: (
    <NodeIconWrapper className="large">
      <img src={twitterImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.LIKE_TWITTER]: (
    <NodeIconWrapper className="large">
      <img src={twitterImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.RETWEET_TWITTER]: (
    <NodeIconWrapper className="large">
      <img src={twitterImg} alt="" />
    </NodeIconWrapper>
  ),
  [WORKFLOW_TYPE.REPLY_TWITTER]: (
    <NodeIconWrapper className="large">
      <img src={twitterImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.SEND_TELEGRAM]: (
    <NodeIconWrapper className="large">
      <img src={telegramImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.SNIPE_TELEGRAM]: (
    <NodeIconWrapper className="large">
      <img src={telegramImg} alt="" />
    </NodeIconWrapper>
  ),

  [WORKFLOW_TYPE.SAVE_WALLET]: <WalletIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SELECT_WALLET]: (
    <WalletArrowIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.SAVE_RESOURCE]: (
    <ObjectGroupIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.CHECK_RESOURCE]: (
    <ObjectUnGroupIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.STOP_SCRIPT]: <StopCircle color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SAVE_LOG]: <LookupIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.UPDATE_PROFILE]: <RocketIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.LOOP]: <ShuffleIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.SOLVE_CAPTCHA]: (
    <CheckCircleIcon color="var(--color-primary)" />
  ),
  [WORKFLOW_TYPE.EXECUTE_CODE]: <CodeIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.HTTP_REQUEST]: <NetworkIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.CALCULATE]: <CalculatorIcon color="var(--color-primary)" />,
  [WORKFLOW_TYPE.ON_OFF_PROFILE]: <SensorIcon color="var(--color-primary)" />,
};

export type INodeGroup = {
  label: string;
  children: INode[];
};

export const getListNode = (): INodeGroup[] => {
  const SCRIPT_NAME = SCRIPT_NAME_EN;
  const NODE_CATEGORY_LABEL = NODE_CATEGORY_LABEL_EN;

  return [
    {
      label: NODE_CATEGORY_LABEL.LAUNCH_TOKEN,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN],
            workflowType: WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN,
            status: NODE_STATUS.INVALID,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN],
            workflowType: WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.AGENT,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.ASK_AGENT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.ASK_AGENT],
            workflowType: WORKFLOW_TYPE.ASK_AGENT,
            status: NODE_STATUS.INVALID,
            timeout: (DEFAULT_EXTENSION_TIMEOUT * 2) / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GENERATE_IMAGE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GENERATE_IMAGE],
            workflowType: WORKFLOW_TYPE.GENERATE_IMAGE,
            status: NODE_STATUS.INVALID,
            timeout: (DEFAULT_EXTENSION_TIMEOUT * 3) / 1000,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.SWAP,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWAP_JUPITER],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWAP_JUPITER],
            workflowType: WORKFLOW_TYPE.SWAP_JUPITER,
            status: NODE_STATUS.INVALID,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWAP_KYBERSWAP],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWAP_KYBERSWAP],
            workflowType: WORKFLOW_TYPE.SWAP_KYBERSWAP,
            status: NODE_STATUS.INVALID,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWAP_UNISWAP],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWAP_UNISWAP],
            workflowType: WORKFLOW_TYPE.SWAP_UNISWAP,
            status: NODE_STATUS.INVALID,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWAP_PANCAKESWAP],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWAP_PANCAKESWAP],
            workflowType: WORKFLOW_TYPE.SWAP_PANCAKESWAP,
            status: NODE_STATUS.INVALID,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWAP_CETUS],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWAP_CETUS],
            workflowType: WORKFLOW_TYPE.SWAP_CETUS,
            status: NODE_STATUS.INVALID,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.ONCHAIN,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GET_WALLET_BALANCE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GET_WALLET_BALANCE],
            workflowType: WORKFLOW_TYPE.GET_WALLET_BALANCE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GET_TOKEN_PRICE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GET_TOKEN_PRICE],
            workflowType: WORKFLOW_TYPE.GET_TOKEN_PRICE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CHECK_TOKEN_PRICE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CHECK_TOKEN_PRICE],
            workflowType: WORKFLOW_TYPE.CHECK_TOKEN_PRICE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CHECK_MARKETCAP],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CHECK_MARKETCAP],
            workflowType: WORKFLOW_TYPE.CHECK_MARKETCAP,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.TRANSFER_TOKEN],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.TRANSFER_TOKEN],
            workflowType: WORKFLOW_TYPE.TRANSFER_TOKEN,
            status: NODE_STATUS.INVALID,

            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN],
            workflowType: WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN,
            status: NODE_STATUS.INVALID,

            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT],
            workflowType: WORKFLOW_TYPE.EVM_SNIPE_CONTRACT,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT],
            workflowType: WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT],
            workflowType: WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.EXECUTE_TRANSACTION],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.EXECUTE_TRANSACTION],
            workflowType: WORKFLOW_TYPE.EXECUTE_TRANSACTION,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT],
            workflowType: WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SELECT_TOKEN],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SELECT_TOKEN],
            workflowType: WORKFLOW_TYPE.SELECT_TOKEN,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SELECT_CHAIN],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SELECT_CHAIN],
            workflowType: WORKFLOW_TYPE.SELECT_CHAIN,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GET_GAS_PRICE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GET_GAS_PRICE],
            workflowType: WORKFLOW_TYPE.GET_GAS_PRICE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GET_PRIORITY_FEE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GET_PRIORITY_FEE],
            workflowType: WORKFLOW_TYPE.GET_PRIORITY_FEE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS],
            workflowType: WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS,
            status: NODE_STATUS.INVALID,
            timeout: (DEFAULT_EXTENSION_TIMEOUT * 10) / 1000,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.BROWSER,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.OPEN_URL],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.OPEN_URL],
            workflowType: WORKFLOW_TYPE.OPEN_URL,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWITCH_WINDOW],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWITCH_WINDOW],
            workflowType: WORKFLOW_TYPE.SWITCH_WINDOW,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.TYPE_TEXT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.TYPE_TEXT],
            workflowType: WORKFLOW_TYPE.TYPE_TEXT,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CLICK],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CLICK],
            workflowType: WORKFLOW_TYPE.CLICK,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CLICK_EXTENSION],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CLICK_EXTENSION],
            workflowType: WORKFLOW_TYPE.CLICK_EXTENSION,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.NEW_TAB],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.NEW_TAB],
            workflowType: WORKFLOW_TYPE.NEW_TAB,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SELECT_TAB],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SELECT_TAB],
            workflowType: WORKFLOW_TYPE.SELECT_TAB,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CLOSE_TAB],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CLOSE_TAB],
            workflowType: WORKFLOW_TYPE.CLOSE_TAB,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GO_BACK],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GO_BACK],
            workflowType: WORKFLOW_TYPE.GO_BACK,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.RELOAD_PAGE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.RELOAD_PAGE],
            workflowType: WORKFLOW_TYPE.RELOAD_PAGE,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SCROLL],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SCROLL],
            workflowType: WORKFLOW_TYPE.SCROLL,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CRAWL_TEXT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CRAWL_TEXT],
            workflowType: WORKFLOW_TYPE.CRAWL_TEXT,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CHECK_ELEMENT_EXIST],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CHECK_ELEMENT_EXIST],
            workflowType: WORKFLOW_TYPE.CHECK_ELEMENT_EXIST,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.ADVANCED,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SAVE_LOG],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SAVE_LOG],
            workflowType: WORKFLOW_TYPE.SAVE_LOG,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },

        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CHECK_CONDITION],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CHECK_CONDITION],
            workflowType: WORKFLOW_TYPE.CHECK_CONDITION,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },

        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GET_RANDOM_VALUE],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GET_RANDOM_VALUE],
            workflowType: WORKFLOW_TYPE.GET_RANDOM_VALUE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.RANDOM_ON_OFF],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.RANDOM_ON_OFF],
            workflowType: WORKFLOW_TYPE.RANDOM_ON_OFF,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SET_ATTRIBUTE],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SET_ATTRIBUTE],
            workflowType: WORKFLOW_TYPE.SET_ATTRIBUTE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CALCULATE],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CALCULATE],
            workflowType: WORKFLOW_TYPE.CALCULATE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.HTTP_REQUEST],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.HTTP_REQUEST],
            workflowType: WORKFLOW_TYPE.HTTP_REQUEST,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.EXECUTE_CODE],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.EXECUTE_CODE],
            workflowType: WORKFLOW_TYPE.EXECUTE_CODE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.RABBY_WALLET,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.IMPORT_RABBY_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.IMPORT_RABBY_WALLET],
            workflowType: WORKFLOW_TYPE.IMPORT_RABBY_WALLET,
            status: NODE_STATUS.RUN,

            seedPhrase: `{${WALLET_VARIABLE?.WALLET_PHRASE}}`,
            privateKey: `{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}`,
            password: "",
            importType: IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE,
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.UNLOCK_RABBY_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.UNLOCK_RABBY_WALLET],
            workflowType: WORKFLOW_TYPE.UNLOCK_RABBY_WALLET,
            status: NODE_STATUS.RUN,

            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CONNECT_RABBY_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CONNECT_RABBY_WALLET],
            workflowType: WORKFLOW_TYPE.CONNECT_RABBY_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CANCEL_RABBY_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CANCEL_RABBY_WALLET],
            workflowType: WORKFLOW_TYPE.CANCEL_RABBY_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SIGN_RABBY_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SIGN_RABBY_WALLET],
            workflowType: WORKFLOW_TYPE.SIGN_RABBY_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET],
            workflowType: WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.PHANTOM_WALLET,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET],
            workflowType: WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET,
            status: NODE_STATUS.INVALID,

            seedPhrase: `{${WALLET_VARIABLE?.WALLET_PHRASE}}`,
            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET],
            workflowType: WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET,
            status: NODE_STATUS.RUN,

            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET],
            workflowType: WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET,
            status: NODE_STATUS.RUN,

            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET],
            workflowType: WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET,
            status: NODE_STATUS.RUN,

            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.MARTIAN_WALLET,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET],
            workflowType: WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET,
            status: NODE_STATUS.INVALID,

            seedPhrase: `{${WALLET_VARIABLE?.WALLET_PHRASE}}`,
            privateKey: `{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}`,
            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET],
            workflowType: WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET,
            status: NODE_STATUS.INVALID,

            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET],
            workflowType: WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET],
            workflowType: WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.METAMASK_WALLET,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.IMPORT_METAMASK_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.IMPORT_METAMASK_WALLET],
            workflowType: WORKFLOW_TYPE.IMPORT_METAMASK_WALLET,

            status: NODE_STATUS.RUN,
            seedPhrase: `{${WALLET_VARIABLE?.WALLET_PHRASE}}`,
            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET],
            workflowType: WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET,
            status: NODE_STATUS.INVALID,

            password: "",
            timeout: DEFAULT_EXTENSION_TIMEOUT / 1000,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CONNECT_METAMASK_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CONNECT_METAMASK_WALLET],
            workflowType: WORKFLOW_TYPE.CONNECT_METAMASK_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.APPROVE_METAMASK_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.APPROVE_METAMASK_WALLET],
            workflowType: WORKFLOW_TYPE.APPROVE_METAMASK_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET],
            workflowType: WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CANCEL_METAMASK_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CANCEL_METAMASK_WALLET],
            workflowType: WORKFLOW_TYPE.CANCEL_METAMASK_WALLET,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.TWITTER,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.LOGIN_TWITTER],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.LOGIN_TWITTER],
            workflowType: WORKFLOW_TYPE.LOGIN_TWITTER,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.FOLLOW_TWITTER],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.FOLLOW_TWITTER],
            workflowType: WORKFLOW_TYPE.FOLLOW_TWITTER,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.LIKE_TWITTER],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.LIKE_TWITTER],
            workflowType: WORKFLOW_TYPE.LIKE_TWITTER,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.RETWEET_TWITTER],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.RETWEET_TWITTER],
            workflowType: WORKFLOW_TYPE.RETWEET_TWITTER,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.REPLY_TWITTER],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.REPLY_TWITTER],
            workflowType: WORKFLOW_TYPE.REPLY_TWITTER,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.TELEGRAM,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SEND_TELEGRAM],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SEND_TELEGRAM],
            workflowType: WORKFLOW_TYPE.SEND_TELEGRAM,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SNIPE_TELEGRAM],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SNIPE_TELEGRAM],
            workflowType: WORKFLOW_TYPE.SNIPE_TELEGRAM,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
      ],
    },
    {
      label: NODE_CATEGORY_LABEL.OTHER,
      children: [
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.UPDATE_PROFILE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.UPDATE_PROFILE],
            workflowType: WORKFLOW_TYPE.UPDATE_PROFILE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.ON_OFF_PROFILE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.ON_OFF_PROFILE],
            workflowType: WORKFLOW_TYPE.ON_OFF_PROFILE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.GENERATE_PROFILE],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.GENERATE_PROFILE],
            workflowType: WORKFLOW_TYPE.GENERATE_PROFILE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.LOOP],
          config: {
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.LOOP],
            workflowType: WORKFLOW_TYPE.LOOP,
            status: NODE_STATUS.RUN,

            loop: 1,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SOLVE_CAPTCHA],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SOLVE_CAPTCHA],
            workflowType: WORKFLOW_TYPE.SOLVE_CAPTCHA,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SAVE_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SAVE_WALLET],
            workflowType: WORKFLOW_TYPE.SAVE_WALLET,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SELECT_WALLET],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SELECT_WALLET],
            workflowType: WORKFLOW_TYPE.SELECT_WALLET,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.SAVE_RESOURCE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.SAVE_RESOURCE],
            workflowType: WORKFLOW_TYPE.SAVE_RESOURCE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.CHECK_RESOURCE],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.CHECK_RESOURCE],
            workflowType: WORKFLOW_TYPE.CHECK_RESOURCE,
            status: NODE_STATUS.INVALID,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.CUSTOM_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.STOP_SCRIPT],
          config: {
            ...commonNodeConfig,
            sleep: DEFAULT_SLEEP_TIME,
            name: SCRIPT_NAME[WORKFLOW_TYPE.STOP_SCRIPT],
            workflowType: WORKFLOW_TYPE.STOP_SCRIPT,
            status: NODE_STATUS.RUN,
          },
          version: "v1.1",
        },
        {
          type: NODE_TYPE.COMMENT_NODE,
          icon: mapNodeIcon[WORKFLOW_TYPE.COMMENT],
          config: {
            sleep: 0,
            name: SCRIPT_NAME[WORKFLOW_TYPE.COMMENT],
            workflowType: WORKFLOW_TYPE.COMMENT,
          },
          version: "v1.1",
        },
      ],
    },
  ];
};
