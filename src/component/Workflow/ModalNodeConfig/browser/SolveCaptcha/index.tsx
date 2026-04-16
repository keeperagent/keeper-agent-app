import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Row, Button, Select } from "antd";
import { ISolveCaptchaNodeConfig } from "@/electron/type";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { CAPTCHA_TYPE } from "@/electron/constant";
import { useTranslation } from "@/hook";
import reCaptchaImg from "@/asset/recaptcha.png";
import hCaptchaImg from "@/asset/hcaptcha.png";
import cloudflareImg from "@/asset/cloudflare.png";
import { PasswordInput } from "@/component/Input";
import { Wrapper, OptionWrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";

const { Option } = Select;

const listCaptcha = [
  {
    value: CAPTCHA_TYPE.RECAPTCHAV2,
    image: reCaptchaImg,
    name: "ReCaptcha",
  },
  {
    value: CAPTCHA_TYPE.HCAPTCHA,
    image: hCaptchaImg,
    name: "HCaptcha",
  },
  {
    value: CAPTCHA_TYPE.TURNSTILE_CLOUDFLARE,
    image: cloudflareImg,
    name: "Cloudflare Turnstile",
  },
];

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISolveCaptchaNodeConfig) => void;
  config: ISolveCaptchaNodeConfig;
  isModalOpen: boolean;
};

const SolveCaptcha = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

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
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      captchaType: config?.captchaType,
      twoCaptchaAPIKey: config?.twoCaptchaAPIKey,
      retry: config?.retry || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
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
        captchaType,
        twoCaptchaAPIKey,
        retry,
      } = await form?.validateFields([
        "sleep",
        "name",
        "timeout",
        "onError",
        "onSuccess",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "captchaType",
        "twoCaptchaAPIKey",
        "retry",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        timeout,
        onError,
        onSuccess,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        captchaType,
        twoCaptchaAPIKey,
        retry,
      });
      onCloseModal();
    } catch {}
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
              label={`${translate("workflow.captchaType")}:`}
              name="captchaType"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                className="custom-select"
                placeholder={translate("workflow.captchaTypePlaceholder")}
                size="large"
              >
                {listCaptcha?.map((captcha) => (
                  <Option key={captcha?.value}>
                    <OptionWrapper>
                      <div className="logo">
                        <img src={captcha?.image} alt="" />
                      </div>
                      <div className="name">{captcha?.name}</div>
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="2Captcha API key:" name="twoCaptchaAPIKey">
              <PasswordInput
                name="twoCaptchaAPIKey"
                placeholder={translate("setting.enterApiKey")}
                extendClass="twoCaptchaAPIKey"
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting hideMaxConcurrency={true} />}

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

export default SolveCaptcha;
