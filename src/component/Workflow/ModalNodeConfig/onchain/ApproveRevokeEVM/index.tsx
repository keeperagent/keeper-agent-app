import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  INodeEndpointGroup,
  IApproveRevokeEVMNodeConfig,
} from "@/electron/type";
import { CHAIN_TYPE, WALLET_VARIABLE } from "@/electron/constant";
import {
  NODE_ACTION,
  DEFAULT_EXTENSION_TIMEOUT,
} from "@/electron/simulator/constant";
import { TagOption } from "@/component";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation, useGetListNodeEndpointGroup } from "@/hook";
import { getChainConfig } from "@/service/util";
import { Wrapper, OptionWrapper, ChainWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";

const { TextArea } = Input;
const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IApproveRevokeEVMNodeConfig) => void;
  config: IApproveRevokeEVMNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const ApproveRevokeEVM = (props: Props) => {
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
  const [isUnlimitedAmount, setIsUnlimitedAmount] = useState(false);
  const [isRevoke, setIsRevoke] = useState(false);
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
      variable: config?.variable || "TX_HASH_APPROVE_OR_REVOKE_TOKEN_EVM",
      privateKey:
        config?.privateKey || `{{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}}`,
      spenderAddress: config?.spenderAddress,
      tokenAddress: config?.tokenAddress,
      amount: config?.amount,
      isRevoke: Boolean(config?.isRevoke),
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      gasPrice: config?.gasPrice || "",
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setIsUnlimitedAmount(config?.isUnlimitedAmount || false);
    setIsRevoke(Boolean(config?.isRevoke));
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
        variable,
        privateKey,
        spenderAddress,
        tokenAddress,
        amount,
        isRevoke,
        nodeEndpointGroupId,
        gasPrice,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
        maxConcurrency,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "variable",
        "privateKey",
        "spenderAddress",
        "tokenAddress",
        "amount",
        "isRevoke",
        "nodeEndpointGroupId",
        "gasPrice",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "retry",
        "maxConcurrency",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        variable,
        privateKey,
        spenderAddress,
        tokenAddress,
        amount,
        isUnlimitedAmount,
        isRevoke,
        nodeEndpointGroupId,
        gasPrice,
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

  const onChangeApproveOrRevoke = (value: any) => {
    setIsRevoke(Boolean(value));
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
              name="tokenAddress"
              label={
                <FormLabelWrapper>
                  <span className="text">
                    {translate("wallet.addressContractToken")}:
                  </span>
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
                placeholder={translate("wallet.egAddressERC20Token")}
                className="custom-input"
                size="large"
                rows={1}
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.spenderAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="spenderAddress" />
                </FormLabelWrapper>
              }
              name="spenderAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate(
                  "workflow.walletOrContractAddressPlaceholder",
                )}
                className="custom-input"
                size="large"
                rows={1}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.approveOrRevoke")}:`}
              name="isRevoke"
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
                onChange={onChangeApproveOrRevoke}
                options={[
                  { value: false, label: "Approve" },
                  { value: true, label: "Revoke" },
                ]}
              />
            </Form.Item>

            {!isRevoke && (
              <div className="token-mode">
                <TagOption
                  content="Custom amount"
                  checked={!isUnlimitedAmount}
                  onClick={() => setIsUnlimitedAmount(false)}
                  style={{ fontSize: "1.1rem" }}
                />
                <TagOption
                  content="Max amount"
                  checked={isUnlimitedAmount}
                  onClick={() => setIsUnlimitedAmount(true)}
                  style={{ fontSize: "1.1rem" }}
                />
              </div>
            )}

            {!isRevoke && !isUnlimitedAmount && (
              <Form.Item
                label={`${translate("workflow.transferAmount")}:`}
                name="amount"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
                style={{ marginTop: "-0.5rem" }}
              >
                <Input
                  placeholder={translate("workflow.transferAmountPlaceholder")}
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
              name="gasPrice"
              label={
                <FormLabelWrapper>
                  <span className="text">Gas price (Gwei):</span>
                  <WorkflowVariable form={form} fieldName="gasPrice" />
                </FormLabelWrapper>
              }
            >
              <Input
                placeholder={translate("workflow.gasPricePlaceholder")}
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
)(ApproveRevokeEVM);
