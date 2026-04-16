import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, InputNumber, Row, Button, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { NODE_ACTION, DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import { IGetTokenPriceNodeConfig } from "@/electron/type";
import {
  CHAIN_TYPE,
  CUSTOM_CHAIN_ID,
  PRICE_DATA_SOURCE,
} from "@/electron/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { getChainConfig } from "@/service/util";
import coingeckoImg from "@/asset/coingecko.png";
import dexscreenerDarkImg from "@/asset/dexscreener-dark.png";
import dexscreenerWhiteImg from "@/asset/dexscreener-white.png";
import { TAB, TAB_NAME_EN } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import { Wrapper, ChainWrapper } from "./style";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";

const { Option } = Select;
const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IGetTokenPriceNodeConfig) => void;
  config: IGetTokenPriceNodeConfig;
  isModalOpen: boolean;
  isLightMode: boolean;
};

const GetGasPrice = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen, isLightMode } =
    props;
  const [chainType, setChainType] = useState("");
  const [dataSource, setDataSource] = useState("");

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      chainType: config?.chainType || CHAIN_TYPE.EVM,
      dataSource: config?.dataSource || PRICE_DATA_SOURCE.DEXSCREENER,
      coingeckoId: config?.coingeckoId,
      tokenAddress: config?.tokenAddress,
      chainId: config?.chainId,
      variable: config?.variable || "TOKEN_PRICE",
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setChainType(config?.chainType || CHAIN_TYPE.EVM);
    setDataSource(config?.dataSource || PRICE_DATA_SOURCE.DEXSCREENER);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      let {
        sleep,
        name,
        timeout,
        chainType,
        dataSource,
        coingeckoId,
        tokenAddress,
        chainId,
        variable,
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
        "chainType",
        "dataSource",
        "coingeckoId",
        "tokenAddress",
        "chainId",
        "variable",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "retry",
        "maxConcurrency",
      ]);

      if (chainType === CHAIN_TYPE.SOLANA) {
        chainId = CUSTOM_CHAIN_ID.SOLANA;
      } else if (chainType === CHAIN_TYPE.SUI) {
        chainId = CUSTOM_CHAIN_ID.SUI;
      } else if (chainType === CHAIN_TYPE.APTOS) {
        chainId = CUSTOM_CHAIN_ID.APTOS;
      } else if (chainType === CHAIN_TYPE.TON) {
        chainId = CUSTOM_CHAIN_ID.TON;
      }

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        status: NODE_STATUS.RUN,
        chainType,
        dataSource,
        coingeckoId,
        tokenAddress,
        chainId,
        variable,
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

  const onChangeChainType = (value: string) => {
    setChainType(value);
  };

  const onChangeDataSource = (value: string) => {
    setDataSource(value);
  };

  const tokenAddressPlaceholder = useMemo(() => {
    if (chainType === CHAIN_TYPE.EVM) {
      return translate("wallet.egAddressERC20Token");
    }

    if (chainType === CHAIN_TYPE.APTOS) {
      return translate("wallet.egAptosCoinType");
    }

    if (chainType === CHAIN_TYPE.SUI) {
      return translate("wallet.egSuiCoinType");
    }

    if (chainType === CHAIN_TYPE.SOLANA) {
      return translate("wallet.egSolanaTokenAddress");
    }

    return "";
  }, [translate, chainType]);

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
              label={`${translate("workflow.dataSource")}:`}
              name="dataSource"
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
                onChange={onChangeDataSource}
              >
                <Option
                  key={PRICE_DATA_SOURCE.DEXSCREENER}
                  value={PRICE_DATA_SOURCE.DEXSCREENER}
                >
                  <ChainWrapper>
                    <div className="icon">
                      <img
                        src={
                          isLightMode ? dexscreenerDarkImg : dexscreenerWhiteImg
                        }
                        alt=""
                      />
                    </div>
                    <span className="text">DEX Screener</span>
                  </ChainWrapper>
                </Option>

                <Option
                  key={PRICE_DATA_SOURCE.COINGECKO}
                  value={PRICE_DATA_SOURCE.COINGECKO}
                >
                  <ChainWrapper>
                    <div className="icon">
                      <img src={coingeckoImg} alt="" />
                    </div>
                    <span className="text">Coingecko</span>
                  </ChainWrapper>
                </Option>
              </Select>
            </Form.Item>

            {dataSource === PRICE_DATA_SOURCE.COINGECKO && (
              <Form.Item
                label={
                  <FormLabelWrapper>
                    <span className="text">Coin ID: </span>
                    <WorkflowVariable form={form} fieldName="coingeckoId" />
                  </FormLabelWrapper>
                }
                name="coingeckoId"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
              >
                <Input
                  placeholder="For example: bitcoin, ethereum, layerzero, chainlink, ..."
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            )}

            {dataSource === PRICE_DATA_SOURCE.DEXSCREENER && (
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

                {chainType === CHAIN_TYPE.EVM && (
                  <Form.Item
                    label="Chain ID:"
                    name="chainId"
                    rules={[
                      {
                        required: true,
                        message: translate("form.requiredField"),
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder={translate("workflow.chainIdPlaceholder")}
                      className="custom-input-number"
                      size="large"
                      min={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                )}

                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">{translate("tokenAddress")}:</span>
                      <WorkflowVariable form={form} fieldName="tokenAddress" />
                    </FormLabelWrapper>
                  }
                  name="tokenAddress"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <TextArea
                    placeholder={tokenAddressPlaceholder}
                    className="custom-input"
                    size="large"
                    rows={2}
                  />
                </Form.Item>
              </Fragment>
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
    isLightMode: state?.Layout?.isLightMode,
  }),
  {},
)(GetGasPrice);
