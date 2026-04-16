import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Row, Button, InputNumber, Alert } from "antd";
import { IRandomOnOffNodeConfig } from "@/electron/type";
import { useTranslation } from "@/hook";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IRandomOnOffNodeConfig) => void;
  config: IRandomOnOffNodeConfig;
  isModalOpen: boolean;
};

const RandomOnOff = (props: Props) => {
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
      truePercentage: config?.truePercentage,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      maxConcurrency: config?.maxConcurrency || 0,
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
        truePercentage,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        maxConcurrency,
      } = await form?.validateFields([
        "sleep",
        "name",
        "truePercentage",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "maxConcurrency",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        truePercentage,
        onError: NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE,
        onSuccess: NODE_ACTION.CONTINUE_RUN,
        status: NODE_STATUS.RUN,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        retry: 0,
        maxConcurrency,
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
              label={`${translate("workflow.percentageOfOn")} (%):`}
              name="truePercentage"
            >
              <InputNumber
                placeholder={translate("workflow.percentageOfOnPlaceholder")}
                className="custom-input-number"
                size="large"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Alert
              title={translate("workflow.percentageOfOnHelper")}
              type="info"
              showIcon
              className="help"
            />
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting
            hideCondition={true}
            hideTimeout={true}
            hideTelegramCheckbox={true}
            hideRetry={true}
          />
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

export default RandomOnOff;
