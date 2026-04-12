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
  Col,
  Tooltip,
  Tag,
  Collapse,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IEVMWriteContractNodeConfig,
  INodeEndpointGroup,
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
import { getChainConfig, trimText } from "@/service/util";
import { MinusCircleIcon, SquarePlusIcon } from "@/component/Icon";
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
  onSaveNodeConfig: (config: IEVMWriteContractNodeConfig) => void;
  config: IEVMWriteContractNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const getParameterOfFunction = (contractAbi: string, method: string) => {
  const parsedContractAbi = JSON.parse(contractAbi || "[]");
  const methodAbi = parsedContractAbi?.find(
    (item: any) => item?.type === "function" && item?.name === method,
  );
  if (methodAbi) {
    return methodAbi?.inputs?.map((parameter: any) =>
      `${parameter?.name} (${parameter?.type})`.trim(),
    );
  }
  return [];
};

const WriteToContractEVM = (props: Props) => {
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
  const [method, setMethod] = useState("");
  const [contractAbi, setContractAbi] = useState("");

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
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,

      variable: config?.variable || "TX_HASH_WRITE_TO_CONTRACT_EVM",
      privateKey:
        config?.privateKey || `{{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}}`,
      contractAddress: config?.contractAddress,
      contractAbi: config?.contractAbi,
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      listInput: config?.listInput || [],
      method: config?.method,
      transactionType: EVM_TRANSACTION_TYPE.LEGACY,
      gasLimit: config?.transactionConfig?.gasLimit || "",
      gasPrice: config?.transactionConfig?.gasPrice?.toString() || "",
      nativeTokenAmount: config?.transactionConfig?.nativeTokenAmount || "0",
      shouldWaitTransactionComfirmed:
        typeof config?.transactionConfig?.shouldWaitTransactionComfirmed ===
        "undefined"
          ? true
          : Boolean(config?.transactionConfig?.shouldWaitTransactionComfirmed),
      retry: config?.retry || 0,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setActiveTab(TAB.DETAIL);
    setContractAbi(config?.contractAbi || "");
    setMethod(config?.method || "");
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
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        variable,
        privateKey,
        contractAddress,
        contractAbi,
        nodeEndpointGroupId,
        listInput,
        method,
        nativeTokenAmount,
        gasLimit,
        gasPrice,
        shouldWaitTransactionComfirmed,
        retry,
        maxConcurrency,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "variable",
        "privateKey",
        "contractAddress",
        "contractAbi",
        "nodeEndpointGroupId",
        "listInput",
        "method",
        "nativeTokenAmount",
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
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        alertTelegramWhenError,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        variable,
        privateKey,
        contractAddress,
        contractAbi,
        nodeEndpointGroupId,
        listInput,
        method,
        transactionConfig: {
          gasLimit,
          isUseCustomGasLimit: gasLimit !== "0" && gasLimit !== "",
          transactionType: EVM_TRANSACTION_TYPE.LEGACY,
          gasPrice,
          isUseCustomGasPrice: gasPrice !== "0" && gasPrice !== "",
          shouldWaitTransactionComfirmed,
          nativeTokenAmount,
        },
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

  const listFunctionName = useMemo(() => {
    const parsedContractAbi = JSON.parse(contractAbi || "[]");
    const listName =
      parsedContractAbi
        ?.filter(
          (item: any) =>
            item?.type === "function" &&
            item?.name &&
            item?.stateMutability !== "view",
        )
        ?.map((item: any) => item?.name) || [];

    return listName;
  }, [contractAbi]);

  const listParameter = useMemo(() => {
    return getParameterOfFunction(contractAbi, method);
  }, [method, contractAbi]);

  const onChangeMetthod = (value: string) => {
    form.setFieldsValue({ listInput: [] });
    setMethod(value);
  };

  const renderListInput = () => {
    return (
      <Form.List name="listInput">
        {(fields, { add, remove }) => (
          <div className="list-parameter">
            <div
              className="label-wrapper"
              style={{
                marginBottom: fields?.length > 0 ? "var(--margin-bottom)" : "0",
              }}
            >
              <span>{translate("workflow.listInputParameter")}:</span>

              {fields?.length < listParameter?.length && (
                <Tooltip title={translate("workflow.addParameter")}>
                  <div
                    className="parameter-icon"
                    onClick={() => add()}
                    style={{ marginLeft: "var(--margin-left)" }}
                  >
                    <SquarePlusIcon />
                  </div>
                </Tooltip>
              )}

              {listParameter?.length === 0 && (
                <Tag style={{ marginLeft: "0.5rem" }}>not required</Tag>
              )}
            </div>

            {fields.map(({ key, name, ...restField }) => {
              const index = name;
              return (
                <div className="parameter" key={key}>
                  <span className="parameter-label">
                    <Tag color="orange">
                      {translate("workflow.parameter")} {index + 1}
                    </Tag>

                    <FormLabelWrapper>
                      <WorkflowVariable
                        form={form}
                        fieldName={"listInput"}
                        indexOfValue={index}
                      />
                    </FormLabelWrapper>

                    <Tooltip title={translate("workflow.removeParameter")}>
                      <div
                        className="parameter-icon"
                        onClick={() => remove(index)}
                        style={{ marginLeft: "var(--margin-left)" }}
                      >
                        <MinusCircleIcon />
                      </div>
                    </Tooltip>

                    {listParameter?.[index] && (
                      <div className="variable-name">
                        <Tag color="blue">
                          {trimText(listParameter?.[index], 37)}
                        </Tag>
                      </div>
                    )}
                  </span>

                  <Form.Item
                    {...restField}
                    name={[index]}
                    style={{
                      width: "100%",
                    }}
                  >
                    <Input
                      placeholder={translate("workflow.enterParameter")}
                      className="custom-input"
                      size="large"
                    />
                  </Form.Item>
                </div>
              );
            })}
          </div>
        )}
      </Form.List>
    );
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

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.contractAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="contractAddress" />
                </FormLabelWrapper>
              }
              name="contractAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterContractAddress")}
                className="custom-input"
                size="large"
                rows={1}
              />
            </Form.Item>

            <Form.Item
              name="contractAbi"
              label="Contract ABI:"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterContractAbi")}
                className="custom-input"
                size="large"
                rows={3}
                onChange={(event) => {
                  setContractAbi(event?.target?.value);
                }}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.contractMethodName")}:`}
              name="method"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                showSearch
                disabled={!contractAbi}
                placeholder={translate("workflow.egWriteContractMethodName")}
                size="large"
                className="custom-select"
                onChange={onChangeMetthod}
              >
                {listFunctionName?.map((functionName: string) => (
                  <Option key={functionName} value={functionName}>
                    {functionName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {renderListInput()}

            <Form.Item
              name="nativeTokenAmount"
              label={
                <FormLabelWrapper>
                  <span className="text">Native token amount:</span>
                  <WorkflowVariable form={form} fieldName="nativeTokenAmount" />
                </FormLabelWrapper>
              }
            >
              <Input
                placeholder={translate("workflow.nativeTokenInputPlaceholder")}
                className="custom-input"
                size="large"
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
)(WriteToContractEVM);
