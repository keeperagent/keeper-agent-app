import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  Row,
  Button,
  Select,
  Checkbox,
  InputNumber,
  Col,
  Collapse,
  Popover,
  Tag,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { INodeEndpointGroup, ISwapKyberswapNodeConfig } from "@/electron/type";
import {
  CHAIN_TYPE,
  WALLET_VARIABLE,
  EVM_TRANSACTION_TYPE,
  MESSAGE,
} from "@/electron/constant";
import {
  NODE_ACTION,
  DEFAULT_EXTENSION_TIMEOUT,
} from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation, useGetListNodeEndpointGroup } from "@/hook";
import { getChainConfig } from "@/service/util";
import { ArrowUpRightIcon } from "@/component/Icon";
import {
  Wrapper,
  OptionWrapper,
  ChainWrapper,
  ChainLabelWrapper,
  ContractWrapper,
} from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import {
  CHAIN_CONFIG,
  mapKyberswapContract,
  mapKyberswapContractUrl,
} from "./config";

const { TextArea } = Input;
const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISwapKyberswapNodeConfig) => void;
  config: ISwapKyberswapNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const SwapKyberswap = (props: Props) => {
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
  const [isInputNativeToken, setIsInputNativeToken] = useState(false);
  const [isOutputNativeToken, setIsOutputNativeToken] = useState(false);
  const [chainKey, setChainKey] = useState("");
  const [form] = Form.useForm();

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
  }, []);

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
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,

      variable: config?.variable || "TX_HASH_SWAP_KYBERSWAP",
      chainKey: config?.swapInput?.chainKey || "ethereum",
      inputTokenAddress: config?.swapInput?.inputTokenAddress,
      isInputNativeToken: config?.swapInput?.isInputNativeToken,
      outputTokenAddress: config?.swapInput?.outputTokenAddress,
      isOutputNativeToken: config?.swapInput?.isOutputNativeToken,
      inputTokenDecimal: 0, // default value
      outputTokenDecimal: 0, // default value
      amount: config?.swapInput?.amount,
      slippage: config?.swapInput?.slippage || 0.3,
      priceImpact: config?.swapInput?.priceImpact || 1,
      dealineInSecond: config?.swapInput?.dealineInSecond || 10,
      gasLimit: config?.swapInput?.gasLimit?.toString() || "",
      transactionType: EVM_TRANSACTION_TYPE.LEGACY,
      gasPrice: config?.swapInput?.gasPrice?.toString() || "",
      numberOfTrasaction: config?.numberOfTrasaction || "1",
      shouldWaitTransactionComfirmed:
        typeof config?.swapInput?.shouldWaitTransactionComfirmed === "undefined"
          ? true
          : Boolean(config?.swapInput?.shouldWaitTransactionComfirmed),
      includedSources: config?.swapInput?.includedSources,
      excludedSources: config?.swapInput?.excludedSources,
    });
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setActiveTab(TAB.DETAIL);
    setIsInputNativeToken(Boolean(config?.swapInput?.isInputNativeToken));
    setIsOutputNativeToken(Boolean(config?.swapInput?.isOutputNativeToken));
    setChainKey(config?.swapInput?.chainKey || "");
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
        nodeEndpointGroupId,
        numberOfTrasaction,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        variable,
        chainKey,
        inputTokenAddress,
        outputTokenAddress,
        amount,
        slippage,
        priceImpact,
        dealineInSecond,
        gasLimit,
        gasPrice,
        shouldWaitTransactionComfirmed,
        includedSources,
        excludedSources,
        isInputNativeToken,
        isOutputNativeToken,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "privateKey",
        "nodeEndpointGroupId",
        "numberOfTrasaction",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "variable",
        "chainKey",
        "inputTokenAddress",
        "outputTokenAddress",
        "amount",
        "slippage",
        "priceImpact",
        "dealineInSecond",
        "gasLimit",
        "gasPrice",
        "shouldWaitTransactionComfirmed",
        "includedSources",
        "excludedSources",
        "isInputNativeToken",
        "isOutputNativeToken",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        privateKey,
        nodeEndpointGroupId,
        numberOfTrasaction,
        variable,
        swapInput: {
          chainKey,
          inputTokenAddress,
          outputTokenAddress,
          inputTokenDecimal: 0, // default value
          outputTokenDecimal: 0, // default value
          amount,
          slippage,
          priceImpact,
          dealineInSecond,
          gasLimit,
          isUseCustomGasLimit: gasLimit !== "0" && gasLimit !== "",
          transactionType: EVM_TRANSACTION_TYPE.LEGACY,
          gasPrice,
          isUseCustomGasPrice: gasPrice !== "0" && gasPrice !== "",
          shouldWaitTransactionComfirmed,
          includedSources,
          excludedSources,
          isInputNativeToken,
          isOutputNativeToken,
        },
        status: NODE_STATUS.RUN,
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

  const listValidNodeEndpointGroup = useMemo(() => {
    return listNodeEndpointGroup.filter(
      (item) => item?.chainType === CHAIN_TYPE.EVM,
    );
  }, [listNodeEndpointGroup]);

  const onChangeIsInputNativeToken = (event: any) => {
    if (event?.target?.checked) {
      form?.setFieldsValue({
        isOutputNativeToken: false,
        inputTokenAddress: NATIVE_TOKEN_ADDRESS,
      });
      setIsOutputNativeToken(false);
    }
    setIsInputNativeToken(event?.target?.checked);
    form.validateFields(["inputTokenAddress", "outputTokenAddress"]);
  };

  const onChangeIsOutputNativeToken = (event: any) => {
    if (event?.target?.checked) {
      form?.setFieldsValue({
        isInputNativeToken: false,
        outputTokenAddress: NATIVE_TOKEN_ADDRESS,
      });
      setIsInputNativeToken(false);
    }
    setIsOutputNativeToken(event?.target?.checked);
    form.validateFields(["inputTokenAddress", "outputTokenAddress"]);
  };

  const onOpenLink = (link?: string) => {
    if (!link) {
      return;
    }
    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url: link,
    });
  };

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

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <ChainLabelWrapper>
                      <span>Chain:</span>

                      <Popover
                        content={
                          <ContractWrapper>
                            <div>
                              {translate("workflow.swapVia")}{" "}
                              <strong>
                                KyberSwap: Meta Aggregation Router v2
                              </strong>{" "}
                              contract
                            </div>

                            <div className="address">
                              <span className="text">
                                {mapKyberswapContract
                                  .get(chainKey)
                                  ?.toLocaleLowerCase()}
                              </span>

                              <span
                                className="icon"
                                onClick={() =>
                                  onOpenLink(
                                    mapKyberswapContractUrl.get(chainKey),
                                  )
                                }
                              >
                                <ArrowUpRightIcon color="blue" />
                              </span>
                            </div>
                          </ContractWrapper>
                        }
                      >
                        <Tag className="tag" color="processing">
                          <div className="content">
                            <span className="text">Contract</span>

                            <span className="icon">
                              <ArrowUpRightIcon color="blue" />
                            </span>
                          </div>
                        </Tag>
                      </Popover>
                    </ChainLabelWrapper>
                  }
                  name="chainKey"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Select
                    size="large"
                    className="custom-select"
                    placeholder={translate("workflow.selectChain")}
                    onChange={(value) => setChainKey(value)}
                    optionLabelProp="label"
                    showSearch
                  >
                    {CHAIN_CONFIG?.map((config) => {
                      return (
                        <Option
                          key={config?.chainKey}
                          value={config?.chainKey}
                          label={
                            <ChainWrapper>
                              <div className="icon">
                                <img src={config?.logo} alt="" />
                              </div>
                              <span className="text">{config?.chainName}</span>
                            </ChainWrapper>
                          }
                        >
                          <OptionWrapper>
                            <div className="icon">
                              <img src={config?.logo} alt="" />
                            </div>

                            <div className="content">
                              <div className="name">{config?.chainName}</div>
                              <div className="description">
                                Chain ID: {config.chainId}
                              </div>
                            </div>
                          </OptionWrapper>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
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
              </Col>
            </Row>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.inputTokenAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="inputTokenAddress" />
                </FormLabelWrapper>
              }
              name="inputTokenAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      value !== getFieldValue("outputTokenAddress")
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        translate("workflow.inputOutputTokenMustDiffer"),
                      ),
                    );
                  },
                }),
              ]}
            >
              <TextArea
                placeholder={translate("workflow.inputTokenAddressPlaceholder")}
                className="custom-input"
                size="large"
                rows={1}
                disabled={isInputNativeToken}
                onChange={() => {
                  form.validateFields(["outputTokenAddress"]);
                }}
              />
            </Form.Item>

            <Form.Item
              name="isInputNativeToken"
              valuePropName="checked"
              style={{ marginTop: "-1.3rem" }}
            >
              <Checkbox onChange={onChangeIsInputNativeToken}>
                {translate("workflow.useNativeTokenToSwap")}
              </Checkbox>
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.outputTokenAddress",
                  )}:`}</span>
                  <WorkflowVariable
                    form={form}
                    fieldName="outputTokenAddress"
                  />
                </FormLabelWrapper>
              }
              name="outputTokenAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      value !== getFieldValue("inputTokenAddress")
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        translate("workflow.inputOutputTokenMustDiffer"),
                      ),
                    );
                  },
                }),
              ]}
            >
              <TextArea
                placeholder={translate(
                  "workflow.outputTokenAddressPlaceholder",
                )}
                className="custom-input"
                size="large"
                rows={1}
                disabled={isOutputNativeToken}
                onChange={() => {
                  form.validateFields(["inputTokenAddress"]);
                }}
              />
            </Form.Item>

            <Form.Item
              name="isOutputNativeToken"
              valuePropName="checked"
              style={{ marginTop: "-1.3rem" }}
            >
              <Checkbox onChange={onChangeIsOutputNativeToken}>
                {translate("workflow.receiveNativeTokenAfterSwap")}
              </Checkbox>
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">
                    {translate("workflow.inputTokenAmount")}:
                  </span>
                  <WorkflowVariable form={form} fieldName="amount" />
                </FormLabelWrapper>
              }
              name="amount"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate("workflow.transferAmountPlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={"Slippage tolerance (%):"}
                  name="slippage"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={translate("workflow.slippagePlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Max price impact (%):"
                  name="priceImpact"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={translate("workflow.priceImpactPlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={`${translate("workflow.transactionDealine")}:`}
              name="dealineInSecond"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <InputNumber
                placeholder={translate(
                  "workflow.transactionDealinePlaceholder",
                )}
                className="custom-input-number"
                size="large"
                style={{ width: "100%" }}
                min={1}
              />
            </Form.Item>

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: translate("workflow.advancedSetting"),
                  children: (
                    <Fragment>
                      <Form.Item
                        label="Included sources:"
                        name="includedSources"
                        tooltip={translate("workflow.kyberIncludedDex")}
                      >
                        <Input
                          size="large"
                          className="custom-input"
                          placeholder={translate(
                            "workflow.kyberIncludedDexPlaceholder",
                          )}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Excluded sources:"
                        name="excludedSources"
                        tooltip={translate("workflow.kyberExcludedDex")}
                      >
                        <Input
                          size="large"
                          className="custom-input"
                          placeholder={translate(
                            "workflow.kyberExcludedDexPlaceholder",
                          )}
                        />
                      </Form.Item>
                    </Fragment>
                  ),
                },
              ]}
            />

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: "Transaction settings",
                  children: (
                    <Fragment>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={
                              <FormLabelWrapper>
                                <span className="text">Gas limit:</span>
                                <WorkflowVariable
                                  form={form}
                                  fieldName="gasLimit"
                                />
                              </FormLabelWrapper>
                            }
                            name="gasLimit"
                          >
                            <Input
                              placeholder={translate(
                                "workflow.gasLimitPlaceholder",
                              )}
                              className="custom-input"
                              size="large"
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="gasPrice"
                            label={
                              <FormLabelWrapper>
                                <span className="text">Gas price (Gwei):</span>
                                <WorkflowVariable
                                  form={form}
                                  fieldName="gasPrice"
                                />
                              </FormLabelWrapper>
                            }
                          >
                            <Input
                              placeholder={translate(
                                "workflow.gasPricePlaceholder",
                              )}
                              className="custom-input"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={
                          <FormLabelWrapper>
                            <span className="text">
                              {translate("workflow.totalTransaction")}:
                            </span>
                            <WorkflowVariable
                              form={form}
                              fieldName="numberOfTrasaction"
                            />
                          </FormLabelWrapper>
                        }
                        name="numberOfTrasaction"
                        rules={[
                          {
                            required: true,
                            message: translate("form.requiredField"),
                          },
                        ]}
                        tooltip={translate("workflow.totalTransactionTooltip")}
                      >
                        <Input
                          placeholder={translate(
                            "workflow.totalTransactionPlaceholder",
                          )}
                          className="custom-input"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        name="shouldWaitTransactionComfirmed"
                        valuePropName="checked"
                        style={{ marginTop: "-1rem" }}
                      >
                        <Checkbox>
                          {translate("workflow.shouldWaitTransactionMined")}
                        </Checkbox>
                      </Form.Item>
                    </Fragment>
                  ),
                },
              ]}
            />
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
)(SwapKyberswap);
