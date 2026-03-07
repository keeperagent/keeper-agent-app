import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IConvertTokenAmountNodeConfig,
  INodeEndpointGroup,
} from "@/electron/type";
import { TOKEN_TYPE, TOKEN_TYPE_NAME, CHAIN_TYPE } from "@/electron/constant";
import { NODE_ACTION, DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import { TagOption } from "@/component";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation, useGetListNodeEndpointGroup } from "@/hook";
import { getChainConfig, IChainConfig } from "@/service/util";
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
  onSaveNodeConfig: (config: IConvertTokenAmountNodeConfig) => void;
  config: IConvertTokenAmountNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const ConvertTokenAmount = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listNodeEndpointGroup,
  } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [chainType, setChainType] = useState("");
  const [mode, setMode] = useState(TOKEN_TYPE.NATIVE_TOKEN);
  const [form] = Form.useForm();

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 10000 });
  }, []);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      chainType: config?.chainType || CHAIN_TYPE.EVM,
      variable: config?.variable || "TOKEN_AMOUNT",
      rawAmount: config?.rawAmount,
      tokenAddress: config?.tokenAddress,
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setChainType(config?.chainType || CHAIN_TYPE.EVM);
    setMode(config?.tokenType || TOKEN_TYPE.NATIVE_TOKEN);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setActiveTab(TAB.DETAIL);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSearchNodeEndpointGroup = (text: string) => {
    if (searchNodeEndpointGroupTimeOut) {
      clearTimeout(searchNodeEndpointGroupTimeOut);
    }
    searchNodeEndpointGroupTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page: 1, pageSize: 10000, searchText: text });
    }, 200);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        timeout,
        variable,
        rawAmount,
        tokenAddress,
        chainType,
        nodeEndpointGroupId,
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
        "variable",
        "rawAmount",
        "tokenAddress",
        "chainType",
        "nodeEndpointGroupId",
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
        rawAmount,
        tokenAddress,
        status: NODE_STATUS.RUN,
        chainType,
        nodeEndpointGroupId,
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
      return "SPL Token address:";
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
                  <span className="text">Token raw amount:</span>
                  <WorkflowVariable form={form} fieldName="rawAmount" />
                </FormLabelWrapper>
              }
              name="rawAmount"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate(
                  "workflow.enterTokenRawAmountPlaceholder",
                )}
                className="custom-input"
                size="large"
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
                      key: group?.chainType || CHAIN_TYPE.EVM,
                    }) as IChainConfig;

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
              >
                <TextArea
                  placeholder={tokenAddressPlaceholder}
                  className="custom-input"
                  size="large"
                  rows={4}
                />
              </Form.Item>
            )}
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
)(ConvertTokenAmount);
