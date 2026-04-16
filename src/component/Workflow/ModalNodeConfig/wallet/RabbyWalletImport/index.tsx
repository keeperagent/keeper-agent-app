import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button } from "antd";
import { IImportRabbyWalletNodeConfig } from "@/electron/type";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { NODE_STATUS } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import TagOption from "@/component/TagOption";
import {
  IMPORT_WALLET_TYPE,
  IMPORT_WALLET_TYPE_NAME,
  WALLET_VARIABLE,
} from "@/electron/constant";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IImportRabbyWalletNodeConfig) => void;
  config: IImportRabbyWalletNodeConfig;
  isModalOpen: boolean;
};

const RabbyWalletImportWallet = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();
  const [mode, setMode] = useState(IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      seedPhrase: config?.seedPhrase || `{{${WALLET_VARIABLE?.WALLET_PHRASE}}}`,
      privateKey:
        config?.privateKey || `{{${WALLET_VARIABLE.WALLET_PRIVATE_KEY}}}`,
      password: config?.password || "",
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.RERUN_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
    });
    setMode(config?.importType || IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE);
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
        privateKey,
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
        "privateKey",
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
        privateKey,
        password,
        onError,
        onSuccess,
        status: NODE_STATUS.RUN,
        importType: mode,
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
            <div className="mode">
              <TagOption
                content={
                  IMPORT_WALLET_TYPE_NAME[
                    IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE
                  ]
                }
                checked={mode === IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE}
                onClick={() =>
                  setMode(IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE)
                }
                style={{ fontSize: "1.1rem" }}
              />

              <TagOption
                content={
                  IMPORT_WALLET_TYPE_NAME[
                    IMPORT_WALLET_TYPE.IMPORT_BY_PRIVATE_KEY
                  ]
                }
                checked={mode === IMPORT_WALLET_TYPE.IMPORT_BY_PRIVATE_KEY}
                onClick={() =>
                  setMode(IMPORT_WALLET_TYPE.IMPORT_BY_PRIVATE_KEY)
                }
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            {mode === IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE && (
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
                <Input
                  placeholder={translate("workflow.phrasePlaceholder")}
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            )}

            {mode === IMPORT_WALLET_TYPE.IMPORT_BY_PRIVATE_KEY && (
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
                <Input
                  placeholder={translate("wallet.enterPrivateKey")}
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            )}

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

export default RabbyWalletImportWallet;
