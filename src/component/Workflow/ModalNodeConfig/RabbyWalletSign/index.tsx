import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Row, Button, Checkbox, InputNumber, Select } from "antd";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { ISignRabbyWalletNodeConfig } from "@/electron/type";
import { useTranslation } from "@/hook";
import { RABBY_GAS_MODE } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISignRabbyWalletNodeConfig) => void;
  config: ISignRabbyWalletNodeConfig;
  isModalOpen: boolean;
};

const RabbyWalletSign = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isCustomGasLimit, setIsCustomGasLimit] = useState(false);
  const [isCustomGasPrice, setIsCustomGasPrice] = useState(false);
  const [gasOption, setGasOption] = useState(RABBY_GAS_MODE.NORMAL);
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
      ignoreWarning: config?.ignoreWarning,
      isCustomGasLimit: config?.isCustomGasLimit,
      gasLimit: config?.gasLimit,
      isCustomGasPrice: config?.isCustomGasPrice,
      gasPrice: config?.gasPrice || 0,
      gasOption: config?.gasOption || RABBY_GAS_MODE.NORMAL,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });

    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setIsCustomGasLimit(Boolean(config?.isCustomGasLimit));
    setIsCustomGasPrice(Boolean(config?.isCustomGasPrice));
    setGasOption(config?.gasOption || RABBY_GAS_MODE.NORMAL);
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
        ignoreWarning,
        isCustomGasLimit,
        isCustomGasPrice,
        gasLimit,
        gasPrice,
        gasOption,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "sleep",
        "timeout",
        "name",
        "ignoreWarning",
        "isCustomGasLimit",
        "isCustomGasPrice",
        "gasLimit",
        "gasPrice",
        "gasOption",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);
      onSaveNodeConfig({
        sleep,
        timeout,
        name,
        ignoreWarning,
        isCustomGasLimit,
        isCustomGasPrice,
        gasLimit,
        gasPrice,
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
      });
      onCloseModal();
    } catch {}
  };

  const onChangeIsCustomGasLimit = (event: any) => {
    setIsCustomGasLimit(event?.target?.checked);
  };

  const changeGasOption = (value: string) => {
    setGasOption(value);
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
                      label: "Normal",
                      value: RABBY_GAS_MODE.NORMAL,
                    },
                    {
                      label: "Fast",
                      value: RABBY_GAS_MODE.FAST,
                    },
                    {
                      label: "Instant",
                      value: RABBY_GAS_MODE.INSTANT,
                    },
                    {
                      label: "Custom",
                      value: RABBY_GAS_MODE.CUSTOM,
                    },
                  ]}
                  onChange={changeGasOption}
                />
              </Form.Item>
            )}

            {gasOption === RABBY_GAS_MODE.CUSTOM && isCustomGasPrice && (
              <Form.Item
                name="gasPrice"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
                style={{ marginTop: "-1rem" }}
                label="Custom gas price (gwei):"
              >
                <InputNumber
                  placeholder={translate("workflow.gasPricePlaceholder")}
                  size="large"
                  className="custom-input-number"
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            )}

            <Form.Item
              name="ignoreWarning"
              valuePropName="checked"
              style={{ marginTop: isCustomGasPrice ? "0rem" : "-2rem" }}
            >
              <Checkbox>{translate("workflow.ignoreRabbyWarning")}</Checkbox>
            </Form.Item>
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

export default RabbyWalletSign;
