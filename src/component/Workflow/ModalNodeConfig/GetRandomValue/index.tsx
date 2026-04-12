import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, InputNumber, Row, Button, Tooltip } from "antd";
import { RootState } from "@/redux/store";
import { connect } from "react-redux";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { IGetRandomValueNodeConfig } from "@/electron/type";
import { RANDOM_OPTION } from "@/electron/constant";
import { TagOption } from "@/component";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { MinusCircleIcon, SquarePlusIcon } from "@/component/Icon";
import { Wrapper, ListValueWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import SkipSetting from "../SkipSetting";
import CommonSetting from "../CommonSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IGetRandomValueNodeConfig) => void;
  config: IGetRandomValueNodeConfig;
  isModalOpen: boolean;
};

const GetGasPrice = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(RANDOM_OPTION.RANDOM_NUMBER);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      listValue: config?.listValue || [""],
      min: config?.min,
      max: config?.max,
      decimal: config?.decimal,
      variable: config?.variable || "RANDOM_VALUE",
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setMode((config?.type as RANDOM_OPTION) || RANDOM_OPTION.RANDOM_NUMBER);
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
        min,
        max,
        decimal,
        variable,
        listValue,
        leftSide,
        condition,
        rightSide,
        maxConcurrency,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "onSuccess",
        "onError",
        "min",
        "max",
        "decimal",
        "variable",
        "listValue",
        "leftSide",
        "condition",
        "rightSide",
        "maxConcurrency",
      ]);

      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        type: mode,
        min,
        max,
        decimal,
        variable,
        listValue,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
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

            <div className="mode">
              <TagOption
                content={translate("workflow.randomNumber")}
                checked={mode === RANDOM_OPTION.RANDOM_NUMBER}
                onClick={() => setMode(RANDOM_OPTION.RANDOM_NUMBER)}
                style={{ fontSize: "1.2rem" }}
              />

              <TagOption
                content={translate("workflow.randomOtherType")}
                checked={mode === RANDOM_OPTION.RANDOM_VALUE}
                onClick={() => setMode(RANDOM_OPTION.RANDOM_VALUE)}
                style={{ fontSize: "1.2rem" }}
              />
            </div>

            {mode === RANDOM_OPTION.RANDOM_NUMBER && (
              <Fragment>
                <Form.Item
                  label={`${translate("workflow.minValue")}:`}
                  name="min"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={translate("workflow.minValuePlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  label={`${translate("workflow.maxValue")}:`}
                  name="max"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={translate("workflow.maxValuePlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  label={`${translate("workflow.decimalPlace")}:`}
                  name="decimal"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={translate("workflow.decimalPlacePlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Form.Item>
              </Fragment>
            )}

            {mode === RANDOM_OPTION.RANDOM_VALUE && (
              <ListValueWrapper>
                <div className="title">{translate("workflow.listValue")}:</div>
                <Form.List name="listValue">
                  {(fields, { add, remove }) => (
                    <Fragment>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div className="item" key={key}>
                            <Form.Item
                              {...restField}
                              name={[name]}
                              rules={[
                                {
                                  required: true,
                                  message: translate("form.requiredField"),
                                },
                              ]}
                              style={{ width: "100%", margin: 0 }}
                            >
                              <Input
                                placeholder={translate("workflow.enterValue")}
                                className="custom-input"
                                size="large"
                              />
                            </Form.Item>

                            {fields?.length > 1 && (
                              <div
                                className="icon"
                                onClick={() => remove(name)}
                              >
                                <MinusCircleIcon />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <Tooltip title={translate("workflow.addNewValue")}>
                        <div className="plus" onClick={() => add()}>
                          <SquarePlusIcon />
                        </div>
                      </Tooltip>
                    </Fragment>
                  )}
                </Form.List>
              </ListValueWrapper>
            )}
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

export default connect((_state: RootState) => ({}), {})(GetGasPrice);
