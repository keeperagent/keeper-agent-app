import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { INodeEndpointGroup, ITransferTokenNodeConfig } from "@/electron/type";
import {
  TOKEN_TYPE,
  TOKEN_TYPE_NAME,
  CHAIN_TYPE,
  WALLET_VARIABLE,
} from "@/electron/constant";
import {
  NODE_ACTION,
  DEFAULT_EXTENSION_TIMEOUT,
} from "@/electron/simulator/constant";
import { TagOption } from "@/component";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation, useGetListNodeEndpointGroup } from "@/hook";
import { getChainConfig } from "@/service/util";
import { Wrapper, OptionWrapper, ChainWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import WorkflowVariable from "../WorkflowVariable";
import { FormLabelWrapper } from "../style";

const { TextArea } = Input;
const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ITransferTokenNodeConfig) => void;
  config: ITransferTokenNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const TransferToken = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listNodeEndpointGroup,
  } = props;

  const [chainType, setChainType] = useState("");
  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(TOKEN_TYPE.NATIVE_TOKEN);
  const [form] = Form.useForm();

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
  }, []);

  useEffect(() => {
    if (
      chainType === CHAIN_TYPE.EVM &&
      ![TOKEN_TYPE.NATIVE_TOKEN, TOKEN_TYPE.EVM_ERC20_TOKEN].includes(mode)
    ) {
      setMode(TOKEN_TYPE.NATIVE_TOKEN);
    }

    if (
      chainType === CHAIN_TYPE.APTOS &&
      ![TOKEN_TYPE.NATIVE_TOKEN, TOKEN_TYPE.APTOS_COIN].includes(mode)
    ) {
      setMode(TOKEN_TYPE.NATIVE_TOKEN);
    }

    if (
      chainType === CHAIN_TYPE.SUI &&
      ![TOKEN_TYPE.NATIVE_TOKEN, TOKEN_TYPE.SUI_COIN].includes(mode)
    ) {
      setMode(TOKEN_TYPE.NATIVE_TOKEN);
    }
  }, [chainType, mode]);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      privateKey:
        config?.privateKey || `{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}`,
      toAddress: config?.toAddress,
      amount: config?.amount,
      tokenAddress: config?.tokenAddress,
      variable: config?.variable || "TX_HASH_TRANSFER_TOKEN",
      chainType: config?.chainType || CHAIN_TYPE.EVM,
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      gasPrice: config?.gasPrice,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setMode(config?.tokenType || TOKEN_TYPE.NATIVE_TOKEN);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setActiveTab(TAB.DETAIL);
    setChainType(config?.chainType || CHAIN_TYPE.EVM);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSearchNodeEndpointGroup = (text: string) => {
    if (searchNodeEndpointGroupTimeOut) {
      clearTimeout(searchNodeEndpointGroupTimeOut);
    }
    searchNodeEndpointGroupTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        timeout,
        privateKey,
        variable,
        chainType,
        toAddress,
        tokenAddress,
        amount,
        nodeEndpointGroupId,
        gasPrice,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "privateKey",
        "variable",
        "chainType",
        "toAddress",
        "tokenAddress",
        "amount",
        "nodeEndpointGroupId",
        "gasPrice",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        tokenType: mode,
        variable,
        chainType,
        privateKey,
        toAddress,
        tokenAddress,
        amount,
        status: NODE_STATUS.RUN,
        nodeEndpointGroupId,
        gasPrice,
        onError,
        onSuccess,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
      });

      onCloseModal();
    } catch {}
  };

  const tokenAddressLabel = useMemo(() => {
    if (mode === TOKEN_TYPE.EVM_ERC20_TOKEN) {
      return `${translate("wallet.addressContractToken")}:`;
    }

    if (mode === TOKEN_TYPE.APTOS_COIN) {
      return "Coin type:";
    }

    if (mode === TOKEN_TYPE.SUI_COIN) {
      return "Object Type:";
    }

    if (mode === TOKEN_TYPE.SOLANA_TOKEN) {
      return "Token address:";
    }

    return "";
  }, [translate, mode, chainType]);

  const tokenAddressPlaceholder = useMemo(() => {
    if (mode === TOKEN_TYPE.EVM_ERC20_TOKEN) {
      return translate("wallet.egAddressERC20Token");
    }

    if (mode === TOKEN_TYPE.APTOS_COIN) {
      return translate("wallet.egAptosCoinType");
    }

    if (mode === TOKEN_TYPE.SUI_COIN) {
      return translate("wallet.egSuiCoinType");
    }

    if (mode === TOKEN_TYPE.SOLANA_TOKEN) {
      return translate("wallet.egSolanaTokenAddress");
    }

    return "";
  }, [translate, mode, chainType]);

  const gasPriceLabel = useMemo(() => {
    if (chainType === CHAIN_TYPE.EVM) {
      return "Gas price (Gwei)";
    }

    if (chainType === CHAIN_TYPE.SUI) {
      return "Gas price (MIST)";
    }

    if (chainType === CHAIN_TYPE.SOLANA) {
      return "Priority fee (Micro lamport)";
    }

    if (chainType === CHAIN_TYPE.APTOS) {
      return "Gas price (Gas Units)";
    }

    return "";
  }, [chainType]);

  const onChangeChainType = (value: string) => {
    setMode(TOKEN_TYPE.NATIVE_TOKEN);
    setChainType(value);
    form?.setFieldValue("nodeEndpointGroupId", null);
  };

  const listValidNodeEndpointGroup = useMemo(() => {
    return listNodeEndpointGroup.filter(
      (item) => item?.chainType === chainType,
    );
  }, [listNodeEndpointGroup, chainType]);

  return (
    <Wrapper>
      <Tabs
        onChange={onChange}
        type="card"
        size="small"
        items={[
          {
            label: TAB_NAME[TAB.DETAIL],
            key: TAB.DETAIL,
          },
          {
            label: TAB_NAME[TAB.SETTING],
            key: TAB.SETTING,
          },
          {
            label: TAB_NAME[TAB.SKIP],
            key: TAB.SKIP,
          },
        ]}
        activeKey={activeTab}
      />

      <Form
        layout="vertical"
        form={form}
        initialValues={{ sleep: 0 }}
        onFinish={onSubmit}
      >
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Form.Item
              label={`${translate("workflow.variableToSaveResult")}:`}
              name="variable"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate(
                  "workflow.variableToSaveResultPlaceholder",
                )}
                className="custom-input"
                size="large"
                onInput={(e) =>
                  ((e.target as HTMLInputElement).value = (
                    e.target as HTMLInputElement
                  )?.value
                    .toUpperCase()
                    ?.replaceAll(" ", ""))
                }
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "wallet.privateKey",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="privateKey" />
                </FormLabelWrapper>
              }
              name="privateKey"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.privateKeyPlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.receipientAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="toAddress" />
                </FormLabelWrapper>
              }
              name="toAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.walletAddressPlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("wallet.blockchainType")}:`}
              name="chainType"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("wallet.egBlockchainType")}
                size="large"
                className="custom-select"
                onChange={onChangeChainType}
              >
                {getChainConfig(locale)?.map((config: any) => {
                  return (
                    <Option key={config?.key} value={config?.key}>
                      <ChainWrapper>
                        <div className="icon">
                          <img src={config?.image} alt="" />
                        </div>
                        <span className="text">{config?.name}</span>
                      </ChainWrapper>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item
              label={`${translate("nodeEndpoint.group")}:`}
              name="nodeEndpointGroupId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("nodeEndpoint.groupPlaceholder")}
                size="large"
                className="custom-select"
                showSearch
                onSearch={onSearchNodeEndpointGroup}
                filterOption={false}
                loading={isSelectLoading}
                optionLabelProp="label"
              >
                {listValidNodeEndpointGroup?.map(
                  (group: INodeEndpointGroup) => {
                    const chainConfig = _.find(getChainConfig(locale), {
                      key: CHAIN_TYPE.EVM,
                    });

                    return (
                      <Option
                        key={group?.id}
                        value={group?.id}
                        label={
                          <ChainWrapper>
                            <div className="icon">
                              <img src={chainConfig?.image} alt="" />
                            </div>
                            <span className="text">{group?.name}</span>
                          </ChainWrapper>
                        }
                      >
                        <OptionWrapper>
                          <div className="icon">
                            <img src={chainConfig?.image} alt="" />
                          </div>

                          <div className="content">
                            <div className="name">{group?.name}</div>
                            <div className="description">
                              {translate("nodeProvider.totalNode")}:{" "}
                              {group?.totalNodeEndpoint || 0}
                            </div>
                          </div>
                        </OptionWrapper>
                      </Option>
                    );
                  },
                )}
              </Select>
            </Form.Item>

            <div className="token-mode">
              <TagOption
                content={TOKEN_TYPE_NAME[TOKEN_TYPE.NATIVE_TOKEN]}
                checked={mode === TOKEN_TYPE.NATIVE_TOKEN}
                onClick={() => setMode(TOKEN_TYPE.NATIVE_TOKEN)}
                style={{ fontSize: "1.1rem" }}
              />
              {chainType === CHAIN_TYPE.EVM && (
                <TagOption
                  content={TOKEN_TYPE_NAME[TOKEN_TYPE.EVM_ERC20_TOKEN]}
                  checked={mode === TOKEN_TYPE.EVM_ERC20_TOKEN}
                  onClick={() => setMode(TOKEN_TYPE.EVM_ERC20_TOKEN)}
                  style={{ fontSize: "1.1rem" }}
                />
              )}

              {chainType === CHAIN_TYPE.APTOS && (
                <TagOption
                  content={TOKEN_TYPE_NAME[TOKEN_TYPE.APTOS_COIN]}
                  checked={mode === TOKEN_TYPE.APTOS_COIN}
                  onClick={() => setMode(TOKEN_TYPE.APTOS_COIN)}
                  style={{ fontSize: "1.1rem" }}
                />
              )}

              {chainType === CHAIN_TYPE.SUI && (
                <TagOption
                  content={TOKEN_TYPE_NAME[TOKEN_TYPE.SUI_COIN]}
                  checked={mode === TOKEN_TYPE.SUI_COIN}
                  onClick={() => setMode(TOKEN_TYPE.SUI_COIN)}
                  style={{ fontSize: "1.1rem" }}
                />
              )}

              {chainType === CHAIN_TYPE.SOLANA && (
                <TagOption
                  content={TOKEN_TYPE_NAME[TOKEN_TYPE.SOLANA_TOKEN]}
                  checked={mode === TOKEN_TYPE.SOLANA_TOKEN}
                  onClick={() => setMode(TOKEN_TYPE.SOLANA_TOKEN)}
                  style={{ fontSize: "1.1rem" }}
                />
              )}
            </div>

            {mode !== TOKEN_TYPE.NATIVE_TOKEN && (
              <Form.Item
                name="tokenAddress"
                label={
                  <FormLabelWrapper>
                    <span className="text">{tokenAddressLabel}</span>
                    <WorkflowVariable form={form} fieldName="tokenAddress" />
                  </FormLabelWrapper>
                }
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
              >
                <TextArea
                  placeholder={tokenAddressPlaceholder}
                  className="custom-input"
                  size="large"
                  rows={2}
                />
              </Form.Item>
            )}

            <Form.Item
              name="amount"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.transferAmount",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="amount" />
                </FormLabelWrapper>
              }
            >
              <Input
                placeholder={translate("workflow.transferAmountPlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="gasPrice"
              label={
                <FormLabelWrapper>
                  <span className="text">{gasPriceLabel}:</span>
                  <WorkflowVariable form={form} fieldName="gasPrice" />
                </FormLabelWrapper>
              }
            >
              <Input
                placeholder={
                  chainType === CHAIN_TYPE.SOLANA
                    ? translate("workflow.priorityFeePlaceholder")
                    : translate("workflow.gasPricePlaceholder")
                }
                className="custom-input"
                size="large"
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting />}

        {activeTab === TAB.SKIP && (
          <SkipSetting form={form} setIsSkip={setIsSkip} isSkip={isSkip} />
        )}

        <Row justify="end" style={{ marginTop: "1rem" }}>
          <Button
            onClick={onCloseModal}
            style={{ marginRight: "var(--margin-right)" }}
          >
            {translate("cancel")}
          </Button>
          <Button htmlType="submit" type="primary">
            {translate("button.update")}
          </Button>
        </Row>
      </Form>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
  }),
  {},
)(TransferToken);
