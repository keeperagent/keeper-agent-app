import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Row, Button, Checkbox, InputNumber, Select } from "antd";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { IConfirmMetamaskNodeConfig } from "@/electron/type";
import { useTranslation } from "@/hook";
import { METAMASK_GAS_MODE } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IConfirmMetamaskNodeConfig) => void;
  config: IConfirmMetamaskNodeConfig;
  isModalOpen: boolean;
};

const MetamaskConfirm = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isCustomGasLimit, setIsCustomGasLimit] = useState(false);
  const [isCustomGasPrice, setIsCustomGasPrice] = useState(false);
  const [gasOption, setGasOption] = useState(METAMASK_GAS_MODE.MARKET);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      name: config?.name,
      isCustomGasLimit: config?.isCustomGasLimit,
      gasLimit: config?.gasLimit,
      isCustomGasPrice: config?.isCustomGasPrice,
      maxBaseFee: config?.maxBaseFee || 0,
      priorityFee: config?.priorityFee || 0,
      gasOption: config?.gasOption || METAMASK_GAS_MODE.MARKET,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
    });

    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setIsCustomGasLimit(Boolean(config?.isCustomGasLimit));
    setIsCustomGasPrice(Boolean(config?.isCustomGasPrice));
    setGasOption(config?.gasOption || METAMASK_GAS_MODE.MARKET);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        timeout,
        name,
        isCustomGasLimit,
        isCustomGasPrice,
        gasLimit,
        maxBaseFee,
        priorityFee,
        gasOption,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
      } = await form?.validateFields([
        "sleep",
        "timeout",
        "name",
        "isCustomGasLimit",
        "isCustomGasPrice",
        "gasLimit",
        "maxBaseFee",
        "priorityFee",
        "gasOption",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "retry",
      ]);
      onSaveNodeConfig({
        sleep,
        timeout,
        name,
        isCustomGasLimit,
        isCustomGasPrice,
        gasLimit,
        maxBaseFee,
        priorityFee,
        gasOption,
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
      });
      onCloseModal();
    } catch {}
  };

  const onChangeIsCustomGasLimit = (event: any) => {
    setIsCustomGasLimit(event?.target?.checked);
  };

  const changeGasOption = (value: string) => {
    setGasOption(value as METAMASK_GAS_MODE);
  };

  const onChangeIsCustomGasPrice = (event: any) => {
    setIsCustomGasPrice(event?.target?.checked);
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

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Form.Item
              name="isCustomGasLimit"
              valuePropName="checked"
              style={{ marginTop: "-0.5rem" }}
            >
              <Checkbox onChange={onChangeIsCustomGasLimit}>
                {translate("workflow.customGasLimit")}
              </Checkbox>
            </Form.Item>

            {isCustomGasLimit && (
              <Form.Item
                name="gasLimit"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
                style={{ marginTop: isCustomGasLimit ? "-0.5rem" : "-2rem" }}
              >
                <InputNumber
                  placeholder={translate("workflow.gasLimitPlaceholder")}
                  size="large"
                  className="custom-input-number"
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            )}

            <Form.Item
              name="isCustomGasPrice"
              valuePropName="checked"
              style={{ marginTop: isCustomGasLimit ? "0" : "-2rem" }}
            >
              <Checkbox onChange={onChangeIsCustomGasPrice}>
                Customize gas price?
              </Checkbox>
            </Form.Item>

            {isCustomGasPrice && (
              <Form.Item
                label="Gas mode:"
                name="gasOption"
                style={{ marginTop: "-1rem" }}
              >
                <Select
                  className="custom-select"
                  size="large"
                  options={[
                    {
                      label: "Low",
                      value: METAMASK_GAS_MODE.LOW,
                    },
                    {
                      label: "Market",
                      value: METAMASK_GAS_MODE.MARKET,
                    },
                    {
                      label: "Aggressive",
                      value: METAMASK_GAS_MODE.AGGRESSIVE,
                    },
                    {
                      label: "Advanced",
                      value: METAMASK_GAS_MODE.ADVANCED,
                    },
                  ]}
                  onChange={changeGasOption}
                />
              </Form.Item>
            )}

            {gasOption === METAMASK_GAS_MODE.ADVANCED && isCustomGasPrice && (
              <Fragment>
                <Form.Item
                  name="maxBaseFee"
                  style={{ marginTop: "-1rem" }}
                  label="Max base fee (gwei):"
                >
                  <InputNumber
                    placeholder={translate("workflow.gasPricePlaceholder")}
                    size="large"
                    className="custom-input-number"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Form.Item>

                <Form.Item
                  name="priorityFee"
                  style={{ marginTop: "-1rem" }}
                  label="Priority fee (gwei):"
                >
                  <InputNumber
                    placeholder={translate("workflow.gasPricePlaceholder")}
                    size="large"
                    className="custom-input-number"
                    style={{ width: "100%" }}
                    min={0}
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

export default MetamaskConfirm;
