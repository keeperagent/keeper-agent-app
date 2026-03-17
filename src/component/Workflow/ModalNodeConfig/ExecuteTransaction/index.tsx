import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  Row,
  Button,
  Select,
  Collapse,
  Col,
  Checkbox,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  INodeEndpointGroup,
  IExecuteTransactionNodeConfig,
} from "@/electron/type";
import {
  CHAIN_TYPE,
  WALLET_VARIABLE,
  EVM_TRANSACTION_TYPE,
} from "@/electron/constant";
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
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";

const { TextArea } = Input;
const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IExecuteTransactionNodeConfig) => void;
  config: IExecuteTransactionNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const ExecuteTransaction = (props: Props) => {
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
  const [chainType, setChainType] = useState<CHAIN_TYPE>(CHAIN_TYPE.EVM);
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
    const selectedChain = config?.chainType || CHAIN_TYPE.EVM;
    setChainType(selectedChain);
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,

      chainType: selectedChain,
      variable: config?.variable || "TX_HASH_EXECUTE_TRANSACTION",
      privateKey:
        config?.privateKey || `{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}`,
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      transactionData: config?.transactionData || "",
      gasLimit: config?.gasLimit?.toString() || "",
      gasPrice: config?.gasPrice?.toString() || "",
      numberOfTrasaction: config?.numberOfTrasaction || "1",
      shouldWaitTransactionComfirmed:
        typeof config?.shouldWaitTransactionComfirmed === "undefined"
          ? true
          : Boolean(config?.shouldWaitTransactionComfirmed),

      // EVM-only
      toAddress: config?.toAddress || "",
      transactionValue: config?.transactionValue || "0",
      transactionType: EVM_TRANSACTION_TYPE.LEGACY,
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
        variable,
        nodeEndpointGroupId,
        transactionData,
        toAddress,
        transactionValue,
        gasLimit,
        gasPrice,
        numberOfTrasaction,
        shouldWaitTransactionComfirmed,
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
        "nodeEndpointGroupId",
        "transactionData",
        "gasLimit",
        "gasPrice",
        "numberOfTrasaction",
        "shouldWaitTransactionComfirmed",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "toAddress",
        "transactionValue",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        privateKey,
        variable,
        nodeEndpointGroupId,
        transactionData,
        chainType,
        gasLimit,
        gasPrice,
        numberOfTrasaction,
        shouldWaitTransactionComfirmed,
        onError,
        onSuccess,
        status: NODE_STATUS.RUN,
        skipSetting: { leftSide, rightSide, condition, isSkip },
        alertTelegramWhenError,
        toAddress,
        transactionValue,
        transactionType: EVM_TRANSACTION_TYPE.LEGACY,
      });

      onCloseModal();
    } catch {}
  };

  const listValidNodeEndpointGroup = useMemo(() => {
    return listNodeEndpointGroup.filter(
      (item) => item?.chainType === chainType,
    );
  }, [listNodeEndpointGroup, chainType]);

  const chainTypeConfig = useMemo(
    () => _.find(getChainConfig(locale), { key: chainType }),
    [chainType, locale],
  );

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
              label={`${translate("wallet.blockchainType")}:`}
              name="chainType"
            >
              <Select
                size="large"
                className="custom-select"
                onChange={(value: CHAIN_TYPE) => {
                  setChainType(value);
                  form.setFieldValue("nodeEndpointGroupId", undefined);
                }}
              >
                {[CHAIN_TYPE.EVM, CHAIN_TYPE.SOLANA].map((chainOption) => {
                  const chainOptionConfig = _.find(getChainConfig(locale), {
                    key: chainOption,
                  });
                  return (
                    <Option key={chainOption} value={chainOption}>
                      <ChainWrapper>
                        <div className="icon">
                          <img src={chainOptionConfig?.image} alt="" />
                        </div>
                        <span className="text">{chainOptionConfig?.name}</span>
                      </ChainWrapper>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            {chainType === CHAIN_TYPE.EVM && (
              <Form.Item
                label={
                  <FormLabelWrapper>
                    <span className="text">{`${translate("workflow.toAddress")}:`}</span>
                    <WorkflowVariable form={form} fieldName="toAddress" />
                  </FormLabelWrapper>
                }
                name="toAddress"
              >
                <Input
                  placeholder={translate("workflow.toAddressPlaceholder")}
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            )}

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate("workflow.transactionData")}:`}</span>
                  <WorkflowVariable form={form} fieldName="transactionData" />
                </FormLabelWrapper>
              }
              name="transactionData"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={
                  chainType === CHAIN_TYPE.SOLANA
                    ? translate("workflow.transactionDataSolanaPlaceholder")
                    : translate("workflow.enterTransactionData")
                }
                className="custom-input"
                size="large"
                rows={5}
              />
            </Form.Item>

            {chainType === CHAIN_TYPE.EVM && (
              <Form.Item
                label={
                  <FormLabelWrapper>
                    <span className="text">{`${translate("workflow.transactionValue")}:`}</span>
                    <WorkflowVariable
                      form={form}
                      fieldName="transactionValue"
                    />
                  </FormLabelWrapper>
                }
                name="transactionValue"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
              >
                <Input
                  placeholder={translate(
                    "workflow.transactionValuePlaceholder",
                  )}
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            )}

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
                  (group: INodeEndpointGroup) => (
                    <Option
                      key={group?.id}
                      value={group?.id}
                      label={
                        <ChainWrapper>
                          <div className="icon">
                            <img src={chainTypeConfig?.image} alt="" />
                          </div>
                          <span className="text">{group?.name}</span>
                        </ChainWrapper>
                      }
                    >
                      <OptionWrapper>
                        <div className="icon">
                          <img src={chainTypeConfig?.image} alt="" />
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
                  ),
                )}
              </Select>
            </Form.Item>

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: translate("workflow.transactionSettings"),
                  children: (
                    <Fragment>
                      {chainType === CHAIN_TYPE.EVM && (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label={
                                <FormLabelWrapper>
                                  <span className="text">{`${translate("workflow.gasLimit")}:`}</span>
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
                                  <span className="text">{`${translate("workflow.gasPrice")}:`}</span>
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
                      )}

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
)(ExecuteTransaction);
