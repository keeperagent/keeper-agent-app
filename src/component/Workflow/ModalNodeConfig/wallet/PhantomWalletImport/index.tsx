import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button } from "antd";
import { IImportPhantomWalletNodeConfig } from "@/electron/type";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { NODE_STATUS } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import { WALLET_VARIABLE } from "@/electron/constant";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IImportPhantomWalletNodeConfig) => void;
  config: IImportPhantomWalletNodeConfig;
  isModalOpen: boolean;
};

const PhantomWalletImportWallet = (props: Props) => {
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
      seedPhrase: config?.seedPhrase || `{{${WALLET_VARIABLE?.WALLET_PHRASE}}}`,
      password: config?.password || "",
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.RERUN_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
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
        timeout,
        name,
        seedPhrase,
        password,
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
        "seedPhrase",
        "password",
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
        seedPhrase,
        password,
        onError,
        onSuccess,
        status: NODE_STATUS.RUN,
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
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "wallet.phrase",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="seedPhrase" />
                </FormLabelWrapper>
              }
              name="seedPhrase"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.phrasePlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={translate("password")}
              rules={[
                {
                  required: true,
                  message: translate("login.passwordEmptyError"),
                },
              ]}
              colon={true}
              className="password"
              name="password"
            >
              <PasswordInput name="password" extendClass="password" />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting hideMaxConcurrency={true} />
        )}

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

export default PhantomWalletImportWallet;
