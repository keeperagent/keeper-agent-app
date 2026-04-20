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
  Tag,
  Popover,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { INodeEndpointGroup, ISwapUniswapNodeConfig } from "@/electron/type";
import {
  CHAIN_TYPE,
  WALLET_VARIABLE,
  EVM_TRANSACTION_TYPE,
} from "@/electron/constant";
import { ArrowUpRightIcon } from "@/component/Icon";
import {
  NODE_ACTION,
  DEFAULT_EXTENSION_TIMEOUT,
} from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import {
  useTranslation,
  useGetListNodeEndpointGroup,
  useOpenExternalLink,
} from "@/hook";
import { getChainConfig } from "@/service/util";
import {
  Wrapper,
  OptionWrapper,
  ChainWrapper,
  ChainLabelWrapper,
  ContractWrapper,
} from "./style";
import {
  TAB,
  TAB_NAME_EN,
} from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";
import {
  CHAIN_CONFIG,
  PANCAKESWAP_LIST_CHAIN,
  UNISWAP_LIST_CHAIN,
  mapUniswapContract,
  mapUniswapContractUrl,
  mapPancakeswapContract,
  mapPancakeswapContractUrl,
} from "./config";

const { TextArea } = Input;
const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISwapUniswapNodeConfig) => void;
  config: ISwapUniswapNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
  isPancakeswap?: boolean;
};

const SwapUniswap = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listNodeEndpointGroup,
    isPancakeswap,
  } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [chainId, setChainId] = useState(1);
  const [form] = Form.useForm();
  const { openExternalLink } = useOpenExternalLink();

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
  }, []);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    const configChainId =
      config?.swapInput?.chainId || (isPancakeswap ? 56 : 1);

    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      privateKey:
        config?.privateKey || `{{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}}`,
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,

      variable: config?.variable || "TX_HASH_SWAP_TOKEN",
      chainId: configChainId,
      poolAddress: config?.swapInput?.poolAddress,
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
      retry: config?.retry || 0,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setActiveTab(TAB.DETAIL);
    setChainId(configChainId);
  }, [isModalOpen, config, form, isPancakeswap]);

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

  const onChangeIsInputNativeToken = (event: any) => {
    if (event?.target?.checked) {
      form?.setFieldValue("isOutputNativeToken", false);
    }
    form.validateFields([
      "inputTokenAddress",
      "outputTokenAddress",
      "maxConcurrency",
    ]);
  };

  const onChangeIsOutputNativeToken = (event: any) => {
    if (event?.target?.checked) {
      form?.setFieldValue("isInputNativeToken", false);
    }
    form.validateFields(["inputTokenAddress", "outputTokenAddress"]);
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
        chainId,
        poolAddress,
        inputTokenAddress,
        isInputNativeToken,
        outputTokenAddress,
        isOutputNativeToken,
        amount,
        slippage,
        priceImpact,
        dealineInSecond,
        gasLimit,
        gasPrice,
        shouldWaitTransactionComfirmed,
        retry,
        maxConcurrency,
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
        "chainId",
        "poolAddress",
        "inputTokenAddress",
        "isInputNativeToken",
        "outputTokenAddress",
        "isOutputNativeToken",
        "amount",
        "slippage",
        "priceImpact",
        "dealineInSecond",
        "gasLimit",
        "gasPrice",
        "shouldWaitTransactionComfirmed",
        "retry",
        "maxConcurrency",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        privateKey,
        nodeEndpointGroupId,
        numberOfTrasaction,
        isUniswap: !isPancakeswap,
        isPancakeSwap: Boolean(isPancakeswap),
        variable,
        swapInput: {
          chainId,
          poolAddress,
          inputTokenAddress,
          isInputNativeToken,
          outputTokenAddress,
          isOutputNativeToken,
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
        retry,
        maxConcurrency,
      });

      onCloseModal();
    } catch {}
  };

  const listValidNodeEndpointGroup = useMemo(() => {
    return listNodeEndpointGroup.filter(
      (item) => item?.chainType === CHAIN_TYPE.EVM,
    );
  }, [listNodeEndpointGroup]);

  const listChainConfig = useMemo(() => {
    let listChainId = UNISWAP_LIST_CHAIN;
    if (isPancakeswap) {
      listChainId = PANCAKESWAP_LIST_CHAIN;
    }

    return listChainId?.map((chainId) => _.find(CHAIN_CONFIG, { chainId }));
  }, [isPancakeswap]);

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
                          isPancakeswap ? (
                            <ContractWrapper>
                              <div>
                                {translate("workflow.swapVia")}{" "}
                                <strong>PancakeSwap Universal Router</strong>{" "}
                                contract
                              </div>

                              <div className="address">
                                <span className="text">
                                  {mapPancakeswapContract
                                    .get(chainId)
                                    ?.toLocaleLowerCase()}
                                </span>

                                <span
                                  className="icon"
                                  onClick={() =>
                                    openExternalLink(
                                      mapPancakeswapContractUrl.get(chainId) ||
                                        "",
                                    )
                                  }
                                >
                                  <ArrowUpRightIcon color="blue" />
                                </span>
                              </div>
                            </ContractWrapper>
                          ) : (
                            <ContractWrapper>
                              <div>
                                {translate("workflow.swapVia")}{" "}
                                <strong>Uniswap Universal Router</strong>{" "}
                                contract
                              </div>

                              <div className="address">
                                <span className="text">
                                  {mapUniswapContract
                                    .get(chainId)
                                    ?.toLocaleLowerCase()}
                                </span>

                                <span
                                  className="icon"
                                  onClick={() =>
                                    openExternalLink(
                                      mapUniswapContractUrl.get(chainId),
                                    )
                                  }
                                >
                                  <ArrowUpRightIcon color="blue" />
                                </span>
                              </div>
                            </ContractWrapper>
                          )
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
                  name="chainId"
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
                    onChange={(value) => setChainId(value)}
                    optionLabelProp="label"
                    showSearch
                  >
                    {listChainConfig?.map((config) => {
                      return (
                        <Option
                          key={config?.chainId}
                          value={config?.chainId}
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
                                Chain ID: {config?.chainId}
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
                    "workflow.poolAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="poolAddress" />
                </FormLabelWrapper>
              }
              name="poolAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.poolAddressPlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

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
                {translate("workflow.useNativeTokenAsInput")}
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
                {translate("workflow.useNativeTokenAsOutput")}
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
)(SwapUniswap);
