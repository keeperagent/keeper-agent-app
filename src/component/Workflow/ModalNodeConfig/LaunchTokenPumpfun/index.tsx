import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  Row,
  Button,
  Select,
  InputNumber,
  Collapse,
  Col,
  Alert,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  ILaunchTokenPumpfunNodeConfig,
  INodeEndpointGroup,
} from "@/electron/type";
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
  onSaveNodeConfig: (config: ILaunchTokenPumpfunNodeConfig) => void;
  config: ILaunchTokenPumpfunNodeConfig;
  isModalOpen: boolean;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const LaunchTokenPumpfun = (props: Props) => {
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
    getListNodeEndpointGroup({ page: 1, pageSize: 10000 });
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

      variableTxHash: config?.variableTxHash || "TX_HASH_LAUNCH_TOKEN_PUMPFUN",
      variableTokenAddress:
        config?.variableTokenAddress || "TOKEN_ADDRESS_PUMPFUN",
      privateKey:
        config?.privateKey || `{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}`,
      tokenName: config?.tokenName,
      symbol: config?.symbol,
      description: config?.description,
      imageUrl: config?.imageUrl,
      twitter: config?.twitter,
      telegram: config?.telegram,
      website: config?.website,
      buyAmountSol: config?.buyAmountSol || "0",
      slippagePercentage: config?.slippagePercentage || 5,
      unitLimit: config?.unitLimit || "300000",
      unitPrice: config?.unitPrice || "100",
      nodeEndpointGroupId: config?.nodeEndpointGroupId,
      vanityAddressPrivateKey: config?.vanityAddressPrivateKey,
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
      getListNodeEndpointGroup({ page: 1, pageSize: 10000, searchText: text });
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
        privateKey,
        nodeEndpointGroupId,
        variableTxHash,
        variableTokenAddress,
        tokenName,
        symbol,
        description,
        imageUrl,
        twitter,
        telegram,
        website,
        buyAmountSol,
        slippagePercentage,
        unitLimit,
        unitPrice,
        vanityAddressPrivateKey,
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
        "privateKey",
        "nodeEndpointGroupId",
        "variableTxHash",
        "variableTokenAddress",
        "tokenName",
        "symbol",
        "description",
        "imageUrl",
        "twitter",
        "telegram",
        "website",
        "buyAmountSol",
        "slippagePercentage",
        "unitLimit",
        "unitPrice",
        "vanityAddressPrivateKey",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
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
        privateKey,
        nodeEndpointGroupId,
        variableTxHash,
        variableTokenAddress,
        tokenName,
        symbol,
        description,
        imageUrl,
        twitter,
        telegram,
        website,
        buyAmountSol,
        slippagePercentage,
        unitLimit,
        unitPrice,
        vanityAddressPrivateKey,
      });

      onCloseModal();
    } catch {}
  };

  const listValidNodeEndpointGroup = useMemo(() => {
    return listNodeEndpointGroup.filter(
      (item) => item?.chainType === CHAIN_TYPE.SOLANA,
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
              label={`${translate("workflow.variableToSaveTransactionHash")}:`}
              name="variableTxHash"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate(
                  "workflow.variableToSaveTransactionHashPlaceholder",
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
              label={`${translate("workflow.variableToSaveTokenAddress")}:`}
              name="variableTokenAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate(
                  "workflow.variableToSaveTokenAddressPlaceholder",
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
                      key: CHAIN_TYPE.SOLANA,
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

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">{translate("tokenName")}:</span>
                      <WorkflowVariable form={form} fieldName="tokenName" />
                    </FormLabelWrapper>
                  }
                  name="tokenName"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Input
                    placeholder={translate("workflow.tokenNamePlaceholder")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.tokenSymbol")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="symbol" />
                    </FormLabelWrapper>
                  }
                  name="symbol"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Input
                    placeholder={translate("workflow.tokenSymbolPlaceholder")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.tokenDescription")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="description" />
                    </FormLabelWrapper>
                  }
                  name="description"
                >
                  <Input
                    placeholder={translate(
                      "workflow.tokenDescriptionPlaceholder",
                    )}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.logoUrl")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="imageUrl" />
                    </FormLabelWrapper>
                  }
                  name="imageUrl"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Input
                    placeholder={translate("workflow.logoUrlPlaceholder")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">Twitter:</span>
                      <WorkflowVariable form={form} fieldName="twitter" />
                    </FormLabelWrapper>
                  }
                  name="twitter"
                >
                  <Input
                    placeholder={translate("workflow.twitterUrlPlaceholder")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">Telegram:</span>
                      <WorkflowVariable form={form} fieldName="telegram" />
                    </FormLabelWrapper>
                  }
                  name="telegram"
                >
                  <Input
                    placeholder={translate("workflow.telegramUrlPlaceholder")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">Website:</span>
                      <WorkflowVariable form={form} fieldName="website" />
                    </FormLabelWrapper>
                  }
                  name="website"
                >
                  <Input
                    placeholder={translate("workflow.websiteUrlPlaceholder")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.buyAmountInSol")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="buyAmountSol" />
                    </FormLabelWrapper>
                  }
                  name="buyAmountSol"
                >
                  <Input
                    placeholder={translate(
                      "workflow.buyAmountInSolPlaceholder",
                    )}
                    className="custom-input"
                    size="large"
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
                          placeholder={translate(
                            "workflow.slippagePercentagePlaceholder",
                          )}
                          className="custom-input-number"
                          size="large"
                          style={{ width: "100%" }}
                          min={0}
                        />
                      </Form.Item>

                      <Form.Item
                        name="unitLimit"
                        label={
                          <FormLabelWrapper>
                            <span className="text">Compute unit limit:</span>
                            <WorkflowVariable
                              form={form}
                              fieldName="unitLimit"
                            />
                          </FormLabelWrapper>
                        }
                      >
                        <Input
                          placeholder={translate(
                            "workflow.enterUnitLimitPlaceholder",
                          )}
                          className="custom-input"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        name="unitPrice"
                        label={
                          <FormLabelWrapper>
                            <span className="text">
                              Compute unit price (microlamports):
                            </span>
                            <WorkflowVariable
                              form={form}
                              fieldName="unitPrice"
                            />
                          </FormLabelWrapper>
                        }
                      >
                        <Input
                          placeholder={translate(
                            "workflow.enterUnitPricePlaceholder",
                          )}
                          className="custom-input"
                          size="large"
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
                  label: translate("workflow.tokenEndingWithPump"),
                  children: (
                    <Fragment>
                      <Alert
                        title={translate("workflow.pumpVanityAddressHelper")}
                        type="info"
                        showIcon
                        className="help"
                      />

                      <Form.Item
                        name="vanityAddressPrivateKey"
                        label={
                          <FormLabelWrapper>
                            <span className="text">
                              {translate("workflow.vanityAddressPrivateKey")}:
                            </span>
                            <WorkflowVariable
                              form={form}
                              fieldName="vanityAddressPrivateKey"
                            />
                          </FormLabelWrapper>
                        }
                      >
                        <TextArea
                          placeholder={translate(
                            "workflow.vanityAddressPrivateKeyPlaceholder",
                          )}
                          className="custom-input"
                          size="large"
                          rows={2}
                        />
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
)(LaunchTokenPumpfun);
