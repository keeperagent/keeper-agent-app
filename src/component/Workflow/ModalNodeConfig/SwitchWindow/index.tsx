import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Row, Button } from "antd";
import { ISwitchWindowNodeConfig } from "@/electron/type";
import { WINDOW_TYPE } from "@/electron/constant";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { TagOption } from "@/component";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISwitchWindowNodeConfig) => void;
  config: ISwitchWindowNodeConfig;
  isModalOpen: boolean;
};

const SwitchWindow = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [form] = Form.useForm();
  const [mode, setMode] = useState(WINDOW_TYPE.POPUP_WINDOW);
  const [isSkip, setIsSkip] = useState(false);

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
      retry: config?.retry || 0,
    });
    setActiveTab(TAB.DETAIL);
    setMode((config?.windowType as WINDOW_TYPE) || WINDOW_TYPE.POPUP_WINDOW);
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
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
      } = await form?.validateFields([
        "url",
        "sleep",
        "timeout",
        "name",
        "onError",
        "onSuccess",
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
        windowType: mode,
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
            <Form.Item label={`${translate("select.popupOrMainPage")}:`}>
              <div className="mode">
                <TagOption
                  content={translate("workflow.extensionPopup")}
                  checked={mode === WINDOW_TYPE.POPUP_WINDOW}
                  onClick={() => setMode(WINDOW_TYPE.POPUP_WINDOW)}
                  style={{ fontSize: "1.1rem" }}
                />

                <TagOption
                  content={translate("workflow.mainPage")}
                  checked={mode === WINDOW_TYPE.MAIN_WINDOW}
                  onClick={() => setMode(WINDOW_TYPE.MAIN_WINDOW)}
                  style={{ fontSize: "1.1rem" }}
                />
              </div>
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

export default SwitchWindow;
