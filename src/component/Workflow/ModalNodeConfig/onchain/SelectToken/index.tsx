import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Tooltip, Alert, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  ISelectTokenNodeConfig,
  ISelectTokenOption,
  INodeEndpointGroup,
} from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { CHAIN_TYPE, SELECT_TOKEN_OUTPUT } from "@/electron/constant";
import { NODE_STATUS } from "@/electron/constant";
import { PlusIcon } from "@/component/Icon";
import { Code } from "@/component";
import { useTranslation, useGetListNodeEndpointGroup } from "@/hook";
import {
  updateItemInList,
  deleteItemInList,
  getChainConfig,
  IChainConfig,
} from "@/service/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import { Wrapper, OptionWrapper, ChainWrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import TokenOption from "./TokenOption";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISelectTokenNodeConfig) => void;
  config: ISelectTokenNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

const SelectToken = (props: Props) => {
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
  const [listTokenOption, setListTokenOption] = useState<ISelectTokenOption[]>(
    [],
  );
  const [form] = Form.useForm();

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
  }, []);

  useEffect(() => {
    if (listTokenOption?.length === 0) {
      setListTokenOption([
        { tokenName: "", tokenAddress: "", minimumAmount: "0" },
      ]);
    }
  }, [listTokenOption]);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      walletAddress: config?.walletAddress,
      chainType: config?.chainType || CHAIN_TYPE.EVM,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setListTokenOption(config?.listOption || []);
    setChainType(config?.chainType || CHAIN_TYPE.EVM);
  }, [isModalOpen, config, form]);

  const onSearchNodeEndpointGroup = (text: string) => {
    if (searchNodeEndpointGroupTimeOut) {
      clearTimeout(searchNodeEndpointGroupTimeOut);
    }
    searchNodeEndpointGroupTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        onSuccess,
        timeout,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        nodeEndpointGroupId,
        chainType,
        walletAddress,
        maxConcurrency,
      } = await form?.validateFields([
        "sleep",
        "name",
        "timeout",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "nodeEndpointGroupId",
        "chainType",
        "walletAddress",
        "maxConcurrency",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        timeout,
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
        nodeEndpointGroupId,
        chainType,
        listOption: listTokenOption?.filter(
          (option: ISelectTokenOption) =>
            option?.tokenName && option?.tokenAddress,
        ),
        walletAddress,
        maxConcurrency,
      });
      onCloseModal();
    } catch {}
  };

  const onChangeTokenOption = (
    tokenOption: ISelectTokenOption,
    index: number,
  ) => {
    setListTokenOption(updateItemInList(index, listTokenOption, tokenOption));
  };

  const onAddTokenOption = () => {
    setListTokenOption([
      ...listTokenOption,
      { tokenName: "", tokenAddress: "", minimumAmount: "0" },
    ]);
  };

  const onRemoveTokenOption = (index: number) => {
    setListTokenOption(deleteItemInList(index, listTokenOption));
  };

  const onChangeChainType = (value: string) => {
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

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
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
                    "workflow.walletAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="walletAddress" />
                </FormLabelWrapper>
              }
              name="walletAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate("workflow.walletAddressPlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item label={`${translate("tokenList")}:`}>
              <Fragment>
                <Alert
                  title={
                    <span>
                      <span style={{ marginLeft: "0.5rem" }}>
                        {translate("workflow.selectTokenHelper1")}:
                      </span>
                      <br />
                      <Code
                        text={SELECT_TOKEN_OUTPUT.SELECTED_TOKEN_NAME}
                        isWithCopy={true}
                        style={{ float: "left" }}
                      />
                      <Code
                        text={SELECT_TOKEN_OUTPUT.SELECTED_TOKEN_ADDRESS}
                        isWithCopy={true}
                        style={{ float: "left" }}
                      />
                    </span>
                  }
                  type="info"
                  showIcon
                  className="help"
                  style={{ marginBottom: "var(--margin-bottom)" }}
                />

                <div
                  style={{
                    paddingRight: listTokenOption?.length > 1 ? "1rem" : "0",
                    maxHeight: listTokenOption?.length > 1 ? "40rem" : "auto",
                    overflowY:
                      listTokenOption?.length > 1 ? "scroll" : "initial",
                  }}
                >
                  {listTokenOption?.map(
                    (tokenOption: ISelectTokenOption, index: number) => (
                      <TokenOption
                        key={index}
                        onChangeTokenOption={onChangeTokenOption}
                        onRemoveTokenOption={onRemoveTokenOption}
                        index={index}
                        tokenOption={tokenOption}
                      />
                    ),
                  )}
                </div>
              </Fragment>
            </Form.Item>

            <div className="add">
              <Tooltip title={translate("add")}>
                <div className="icon" onClick={onAddTokenOption}>
                  <PlusIcon />
                </div>
              </Tooltip>
            </div>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting />}

        {activeTab === TAB.SKIP && (
          <SkipSetting form={form} setIsSkip={setIsSkip} isSkip={isSkip} />
        )}
      </Form>

      <Row justify="end">
        <Button
          onClick={onCloseModal}
          style={{ marginRight: "var(--margin-right)" }}
        >
          {translate("cancel")}
        </Button>
        <Button onClick={onSubmit} type="primary">
          {translate("button.update")}
        </Button>
      </Row>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
  }),
  {},
)(SelectToken);
