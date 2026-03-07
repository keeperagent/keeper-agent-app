import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  Row,
  Col,
  Button,
  Select,
  InputNumber,
  Tooltip,
  Tag,
} from "antd";
import { connect } from "react-redux";
import { MinusCircleIcon, SquarePlusIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import {
  INodeEndpointGroup,
  IEVMSnipeContractNodeConfig,
} from "@/electron/type";
import { CHAIN_TYPE, CONTRACT_SNIPER_MODE } from "@/electron/constant";
import {
  NODE_ACTION,
  DEFAULT_EXTENSION_TIMEOUT,
} from "@/electron/simulator/constant";
import { TagOption } from "@/component";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation, useGetListNodeEndpointGroup } from "@/hook";
import { getChainConfig, trimText } from "@/service/util";
import { Wrapper, OptionWrapper, ChainWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import { convertCamelCaseToVariable } from "../../util";

const { TextArea } = Input;
const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IEVMSnipeContractNodeConfig) => void;
  config: IEVMSnipeContractNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const SnipeContractEVM = (props: Props) => {
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
  const [isStartFromCurrentBlock, setIsStartFromCurrentBlock] = useState(true);
  const [form] = Form.useForm();
  const [contractAbi, setContractAbi] = useState("");
  const [eventName, setEventName] = useState("");

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
      isStartFromCurrentBlock: Boolean(config?.isStartFromCurrentBlock),
      contractAddress: config?.input?.contractAddress,
      contractAbi: config?.contractAbi,
      eventName: config?.eventName,
      profileMode:
        config?.input?.profileMode ||
        CONTRACT_SNIPER_MODE.ONE_EVENT_ALL_PROFILE,
      fromBlock: config?.input?.fromBlock,
      toBlock: config?.input?.toBlock,
      blockStep: config?.input?.blockStep || 1,
      confirmationBlock: config?.input?.confirmationBlock || 0,
      listVariable: config?.input?.listVariable || [],
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setIsStartFromCurrentBlock(Boolean(config?.isStartFromCurrentBlock));
    setActiveTab(TAB.DETAIL);
    setContractAbi(config?.contractAbi || "");
    setEventName(config?.eventName || "");
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

  const onChangeEventName = (value: string) => {
    form.setFieldsValue({ eventName: value, listVariable: [] });
    setEventName(value);
  };

  const listEventName = useMemo(() => {
    const parsedContractAbi = JSON.parse(contractAbi || "[]");
    const listName =
      parsedContractAbi
        ?.filter((item: any) => item?.type === "event" && item?.name)
        ?.map((item: any) => item?.name) || [];

    return listName;
  }, [contractAbi]);

  const listOutput = useMemo(() => {
    const parsedContractAbi = JSON.parse(contractAbi || "[]");
    const eventDetail = parsedContractAbi?.find(
      (item: any) => item?.type === "event" && item?.name === eventName,
    );
    if (eventDetail) {
      return eventDetail?.inputs?.map((parameter: any) =>
        parameter?.name?.trim(),
      );
    }
    return [];
  }, [eventName, contractAbi]);

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        timeout,
        contractAddress,
        contractAbi,
        eventName,
        profileMode,
        fromBlock,
        toBlock,
        blockStep,
        confirmationBlock,
        nodeEndpointGroupId,
        listVariable,
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
        "contractAddress",
        "contractAbi",
        "eventName",
        "profileMode",
        "fromBlock",
        "toBlock",
        "blockStep",
        "confirmationBlock",
        "nodeEndpointGroupId",
        "listVariable",
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
        isStartFromCurrentBlock,
        nodeEndpointGroupId,
        contractAbi,
        eventName,
        input: {
          profileMode,
          contractAddress,
          eventAbi: "",
          fromBlock,
          toBlock,
          blockStep,
          confirmationBlock,
          listVariable,
          listNodeEndpoint: [],
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

  const renderListVariable = () => {
    return (
      <Form.List name="listVariable">
        {(fields, { add, remove }) => (
          <div className="list-parameter">
            <div
              className="label-wrapper"
              style={{
                marginBottom: fields?.length > 0 ? "var(--margin-bottom)" : "0",
              }}
            >
              <span>{translate("workflow.listVariableToSaveResult")}:</span>

              {fields?.length < listOutput?.length && (
                <Tooltip title={translate("workflow.addParameter")}>
                  <div
                    className="parameter-icon"
                    onClick={() =>
                      add(
                        convertCamelCaseToVariable(
                          listOutput?.[fields?.length] || "",
                        ),
                      )
                    }
                    style={{ marginLeft: "var(--margin-left)" }}
                  >
                    <SquarePlusIcon />
                  </div>
                </Tooltip>
              )}
            </div>

            {fields.map(({ key, name, ...restField }) => {
              const index = name;
              return (
                <div className="parameter" key={key}>
                  <span className="parameter-label">
                    <Tag color="orange">
                      {translate("workflow.outputVariable")} {index + 1}
                    </Tag>

                    <Tooltip title={translate("workflow.removeParameter")}>
                      <div
                        className="parameter-icon"
                        onClick={() => remove(index)}
                        style={{ marginLeft: "0.7rem" }}
                      >
                        <MinusCircleIcon />
                      </div>
                    </Tooltip>

                    {listOutput?.[index] && (
                      <div className="variable-name">
                        <Tag color="blue">
                          {trimText(listOutput?.[index], 37)}
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
                      placeholder={translate(
                        "workflow.listVariablePlaceholder",
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
              label={`${translate("workflow.contractAddress")}:`}
              name="contractAddress"
            >
              <TextArea
                placeholder={translate("workflow.contractAddressToMonitor")}
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
                rows={2}
                onChange={(event) => {
                  setContractAbi(event?.target?.value);
                }}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.contractEventName")}:`}
              name="eventName"
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
                placeholder={translate("workflow.egContractMethodName")}
                size="large"
                className="custom-select"
                onChange={onChangeEventName}
              >
                {listEventName?.map((eventName: string) => (
                  <Option key={eventName} value={eventName}>
                    {eventName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {renderListVariable()}

            <div className="token-mode">
              <TagOption
                content={translate("workflow.startFromLastestBlock")}
                checked={isStartFromCurrentBlock}
                onClick={() => setIsStartFromCurrentBlock(true)}
                style={{ fontSize: "1.1rem" }}
              />
              <TagOption
                content={translate("workflow.customBlocknumber")}
                checked={!isStartFromCurrentBlock}
                onClick={() => setIsStartFromCurrentBlock(false)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            {!isStartFromCurrentBlock && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={`${translate("workflow.startBlock")}:`}
                    name="fromBlock"
                    rules={[
                      {
                        required: true,
                        message: translate("form.requiredField"),
                      },
                    ]}
                    style={{ marginTop: "-0.5rem" }}
                    tooltip={translate("workflow.startBlockTooltip")}
                  >
                    <InputNumber
                      placeholder={translate("workflow.startBlockPlaceholder")}
                      className="custom-input"
                      size="large"
                      style={{ width: "100%" }}
                      min={1}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={`${translate("workflow.endBlock")}:`}
                    name="toBlock"
                    rules={[
                      {
                        required: true,
                        message: translate("form.requiredField"),
                      },
                    ]}
                    style={{ marginTop: "-0.5rem" }}
                    tooltip={translate("workflow.endBlockTooltip")}
                  >
                    <InputNumber
                      placeholder={translate("workflow.endBlockPlaceholder")}
                      className="custom-input"
                      size="large"
                      style={{ width: "100%" }}
                      min={1}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={`${translate("workflow.blockStep")}:`}
                  name="blockStep"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                  tooltip={translate("workflow.blockStepTooltip")}
                >
                  <InputNumber
                    placeholder={translate("workflow.blockStepPlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    min={1}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Confirmation block:"
                  name="confirmationBlock"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={translate(
                      "workflow.confirmationBlockPlaceholder",
                    )}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

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

            <Form.Item
              label="Mode:"
              name="profileMode"
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
                options={[
                  {
                    label: translate("workflow.oneEventAllProfile"),
                    value: CONTRACT_SNIPER_MODE.ONE_EVENT_ALL_PROFILE,
                  },
                  {
                    label: translate("workflow.oneEventOneProfile"),
                    value: CONTRACT_SNIPER_MODE.ONE_EVENT_ONE_PROFILE,
                  },
                ]}
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting hideTimeout={true} />}

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
)(SnipeContractEVM);
