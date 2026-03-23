import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, InputNumber, Row, Button } from "antd";
import { ILoopNodeConfig } from "@/electron/type";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import SkipSetting from "../SkipSetting";
import CommonSetting from "../CommonSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ILoopNodeConfig) => void;
  config: ILoopNodeConfig;
  isModalOpen: boolean;
};

const Loop = (props: Props) => {
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
      loop: config?.loop || 1,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
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
      const { sleep, name, loop, leftSide, condition, rightSide } =
        await form?.validateFields([
          "sleep",
          "name",
          "loop",
          "leftSide",
          "condition",
          "rightSide",
        ]);
      onSaveNodeConfig({
        sleep,
        name,
        loop,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        retry: 0,
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
              label={`${translate("workflow.numberOfLoop")}:`}
              name="loop"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <InputNumber
                placeholder={translate("workflow.egNumberOfLoop")}
                className="custom-input-number"
                size="large"
                style={{ width: "100%" }}
                min={1}
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting
            hideTimeout={true}
            hideCondition={true}
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

export default Loop;
