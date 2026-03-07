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
  Collapse,
  Col,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { INodeEndpointGroup, ISwapCetusNodeConfig } from "@/electron/type";
import { CHAIN_TYPE, WALLET_VARIABLE } from "@/electron/constant";
import {
  NODE_ACTION,
  DEFAULT_EXTENSION_TIMEOUT,
} from "@/electron/simulator/constant";
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
  onSaveNodeConfig: (config: ISwapCetusNodeConfig) => void;
  config: ISwapCetusNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const SwapCetus = (props: Props) => {
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

      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,

      variable: config?.variable || "TX_HASH_SWAP_CETUS",
      privateKey:
        config?.privateKey || `{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}`,
      poolAddress: config?.swapInput?.poolAddress,
      inputTokenAddress: config?.swapInput?.inputTokenAddress,
      outputTokenAddress: config?.swapInput?.outputTokenAddress,
      amount: config?.swapInput?.amount,
      slippagePercentage: config?.swapInput?.slippagePercentage || 0.3,
      priceImpactPercentage: config?.swapInput?.priceImpactPercentage || 1,
      numberOfTrasaction: config?.numberOfTrasaction || "1",
      gasPrice: config?.swapInput?.gasPrice?.toString() || "0",
      shouldWaitTransactionComfirmed:
        typeof config?.swapInput?.shouldWaitTransactionComfirmed === "undefined"
          ? true
          : Boolean(config?.swapInput?.shouldWaitTransactionComfirmed),
    });
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
        variable,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        poolAddress,
        inputTokenAddress,
        outputTokenAddress,
        amount,
        slippagePercentage,
        priceImpactPercentage,
        shouldWaitTransactionComfirmed,
        gasPrice,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "privateKey",
        "nodeEndpointGroupId",
        "numberOfTrasaction",
        "variable",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "poolAddress",
        "inputTokenAddress",
        "outputTokenAddress",
        "amount",
        "slippagePercentage",
        "priceImpactPercentage",
        "shouldWaitTransactionComfirmed",
        "gasPrice",
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
          poolAddress,
          inputTokenAddress,
          outputTokenAddress,
          amount,
          slippagePercentage,
          priceImpactPercentage,
          shouldWaitTransactionComfirmed,
          gasPrice,
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
      (item) => item?.chainType === CHAIN_TYPE.SUI,
    );
  }, [listNodeEndpointGroup]);

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
                      key: CHAIN_TYPE.SUI,
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
                rows={2}
                onChange={() => {
                  form.validateFields(["outputTokenAddress"]);
                }}
              />
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
                rows={2}
                onChange={() => {
                  form.validateFields(["inputTokenAddress"]);
                }}
              />
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
                  name="slippagePercentage"
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
                  name="priceImpactPercentage"
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

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: "Transaction settings",
                  children: (
                    <Fragment>
                      <Form.Item
                        name="gasPrice"
                        label={
                          <FormLabelWrapper>
                            <span className="text">Gas price (MIST):</span>
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
)(SwapCetus);
