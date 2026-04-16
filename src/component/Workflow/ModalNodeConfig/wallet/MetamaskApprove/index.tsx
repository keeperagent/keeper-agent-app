import { useEffect, useState, useMemo } from "react";
import { Tabs, Form, Row, Button } from "antd";
import { IApproveMetamaskNodeConfig } from "@/electron/type";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IApproveMetamaskNodeConfig) => void;
  config: IApproveMetamaskNodeConfig;
  isModalOpen: boolean;
};

const MetamaskApprove = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.SETTING);
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
      retry: config?.retry || 0,
    });
    setActiveTab(TAB.SETTING);
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
        "sleep",
        "timeout",
        "name",
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

export default MetamaskApprove;
