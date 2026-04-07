import { Table } from "antd";
import { Code } from "@/component";
import {
  SELECT_CHAIN_OUTPUT,
  SELECT_TOKEN_OUTPUT,
  WALLET_VARIABLE,
  WORKFLOW_TYPE,
  CURRENT_TOKEN_PRICE,
  CURRENT_TOKEN_MARKETCAP,
  SNIPE_CONTRACT_BLOCK_NUMBER,
  SNIPE_CONTRACT_TX_HASH,
  SNIPE_CONTRACT_LOG_INDEX,
  SNIPE_CONTRACT_CONTRACT_ADDRESS,
} from "@/electron/constant";
import { useTranslation } from "@/hook";
import { SCRIPT_NAME_EN } from "@/config/constant";

const columns = (translate: any) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    key: "index",
    width: "5%",
  },
  {
    title: translate("resource.variableName"),
    dataIndex: "variable",
    key: "variable",
    render: (value: string) => (
      <div style={{ display: "flex" }}>
        <Code text={value} isWithCopy={true} />
      </div>
    ),
    width: "30%",
  },
  {
    title: translate("workflow.variableDescription"),
    dataIndex: "description",
    key: "description",
  },
];

const DefaultVariable = () => {
  const { translate } = useTranslation();
  const SCRIPT_NAME = SCRIPT_NAME_EN;

  return (
    <Table
      pagination={false}
      dataSource={[
        {
          index: 1,
          variable: WALLET_VARIABLE.WALLET_PHRASE,
          description: translate("workflow.walletPhraseDesc"),
        },
        {
          index: 2,
          variable: WALLET_VARIABLE.WALLET_PRIVATE_KEY,
          description: translate("workflow.walletPrivateKeyDesc"),
        },
        {
          index: 3,
          variable: WALLET_VARIABLE.WALLET_ADDRESS,
          description: translate("workflow.walletAddressDesc"),
        },
        {
          index: 4,
          variable: SELECT_TOKEN_OUTPUT.SELECTED_TOKEN_NAME,
          description: (
            <span>
              {translate("workflow.selectTokenInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.SELECT_TOKEN]}</strong>
            </span>
          ),
        },
        {
          index: 5,
          variable: SELECT_TOKEN_OUTPUT.SELECTED_TOKEN_ADDRESS,
          description: (
            <span>
              {translate("workflow.selectedTokenAddressInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.SELECT_TOKEN]}</strong>
            </span>
          ),
        },
        {
          index: 6,
          variable: SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_NAME,
          description: (
            <span>
              {translate("workflow.selectedChainInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.SELECT_CHAIN]}</strong>
            </span>
          ),
        },
        {
          index: 7,
          variable: SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_TOKEN_NAME,
          description: (
            <span>
              {translate("workflow.selectTokenInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.SELECT_CHAIN]}</strong>
            </span>
          ),
        },
        {
          index: 8,
          variable: SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_TOKEN_ADDRESS,
          description: (
            <span>
              {translate("workflow.selectedTokenAddressInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.SELECT_CHAIN]}</strong>
            </span>
          ),
        },
        {
          index: 9,
          variable: CURRENT_TOKEN_MARKETCAP,
          description: (
            <span>
              {translate("workflow.checkMarketcapAddressInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.CHECK_MARKETCAP]}</strong>
            </span>
          ),
        },
        {
          index: 10,
          variable: CURRENT_TOKEN_PRICE,
          description: (
            <span>
              {translate("workflow.checkTokenPriceAddressInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.CHECK_MARKETCAP]}</strong>,{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.CHECK_TOKEN_PRICE]}</strong>
            </span>
          ),
        },
        {
          index: 11,
          variable: SNIPE_CONTRACT_BLOCK_NUMBER,
          description: (
            <span>
              {translate("workflow.snipeContractBlockNumberInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]}</strong>
            </span>
          ),
        },
        {
          index: 12,
          variable: SNIPE_CONTRACT_TX_HASH,
          description: (
            <span>
              {translate("workflow.snipeContractTxHashInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]}</strong>
            </span>
          ),
        },
        {
          index: 13,
          variable: SNIPE_CONTRACT_LOG_INDEX,
          description: (
            <span>
              {translate("workflow.snipeContractLogIndexInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]}</strong>
            </span>
          ),
        },
        {
          index: 14,
          variable: SNIPE_CONTRACT_CONTRACT_ADDRESS,
          description: (
            <span>
              {translate("workflow.snipeContractAddressInstruction")}{" "}
              <strong>{SCRIPT_NAME[WORKFLOW_TYPE.EVM_SNIPE_CONTRACT]}</strong>
            </span>
          ),
        },
      ]}
      columns={columns(translate)}
      size="middle"
      scroll={{ y: "67vh" }}
    />
  );
};

export default DefaultVariable;
