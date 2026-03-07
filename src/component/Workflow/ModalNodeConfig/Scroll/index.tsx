import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Row,
  Button,
  Alert,
  Select,
} from "antd";
import { IScrollNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import {
  SELECTOR_TYPE,
  SELECTOR_NAME,
  SCROLL_TYPE,
  SCROLL_TYPE_NAME,
  SCROLL_DIRECTION,
  SCROLL_DIRECTION_NAME,
} from "@/electron/constant";
import { SAMPLE_XPATH } from "@/config/constant";
import { TagOption, Code } from "@/component";
import { useTranslation } from "@/hook";
import { Wrapper, HelpWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IScrollNodeConfig) => void;
  config: IScrollNodeConfig;
  isModalOpen: boolean;
};

const Scroll = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [selectorMode, setSelectorMode] = useState(SELECTOR_TYPE.CSS_SELECTOR);
  const [scrollSelector, setScrollSelector] = useState(
    SCROLL_TYPE.SCROLL_COORDINATES,
  );
  const [scrollDirection, setScrollDirection] = useState(
    SCROLL_DIRECTION.SCROLL_DOWN,
  );
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      cssSelector: config?.cssSelector,
      xPathSelector: config?.xPathSelector,
      yAxis: config?.yAxis,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });

    setSelectorMode(
      (config.selectorType as SELECTOR_TYPE) || SELECTOR_TYPE.CSS_SELECTOR,
    );
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
        cssSelector,
        xPathSelector,
        yAxis,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "cssSelector",
        "xPathSelector",
        "yAxis",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);
      onSaveNodeConfig({
        name,
        sleep,
        timeout,
        selectorType: selectorMode,
        cssSelector,
        xPathSelector,
        scrollSelector,
        scrollDirection,
        yAxis,
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
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Form.Item label={`${translate("workflow.scrollBy")}:`}>
              <Select
                className="custom-select"
                value={scrollSelector}
                onChange={(value) => setScrollSelector(value)}
                size="large"
                options={[
                  {
                    label: translate("workflow.coordinates"),
                    value: SCROLL_TYPE.SCROLL_COORDINATES,
                  },
                  {
                    label: SCROLL_TYPE_NAME[SCROLL_TYPE.SCROLL_SELECTOR],
                    value: SCROLL_TYPE.SCROLL_SELECTOR,
                  },
                ]}
              />
            </Form.Item>

            {/* ------ SELECTOR CSS/XPATH ------ */}
            {scrollSelector === SCROLL_TYPE.SCROLL_SELECTOR && (
              <>
                <div className="selectorMode">
                  <TagOption
                    content={SELECTOR_NAME[SELECTOR_TYPE.CSS_SELECTOR]}
                    checked={selectorMode === SELECTOR_TYPE.CSS_SELECTOR}
                    onClick={() => setSelectorMode(SELECTOR_TYPE.CSS_SELECTOR)}
                    style={{ fontSize: "1.1rem" }}
                  />

                  <TagOption
                    content={SELECTOR_NAME[SELECTOR_TYPE.XPATH_SELECTOR]}
                    checked={selectorMode === SELECTOR_TYPE.XPATH_SELECTOR}
                    onClick={() =>
                      setSelectorMode(SELECTOR_TYPE.XPATH_SELECTOR)
                    }
                    style={{ fontSize: "1.1rem" }}
                  />
                </div>

                {selectorMode === SELECTOR_TYPE.CSS_SELECTOR && (
                  <Form.Item
                    label={
                      <FormLabelWrapper>
                        <span className="text">CSS selector:</span>
                        <WorkflowVariable form={form} fieldName="cssSelector" />
                      </FormLabelWrapper>
                    }
                    name="cssSelector"
                  >
                    <TextArea
                      placeholder={translate("workflow.enterCssSelector")}
                      className="custom-input"
                      size="large"
                      rows={2}
                    />
                  </Form.Item>
                )}

                {selectorMode === SELECTOR_TYPE.XPATH_SELECTOR && (
                  <Fragment>
                    <Form.Item
                      label={
                        <FormLabelWrapper>
                          <span className="text">XPath selector:</span>
                          <WorkflowVariable
                            form={form}
                            fieldName="xPathSelector"
                          />
                        </FormLabelWrapper>
                      }
                      name="xPathSelector"
                    >
                      <TextArea
                        placeholder={translate("workflow.enterXPathSelector")}
                        className="custom-input"
                        size="large"
                        rows={2}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginTop: "-1rem" }}>
                      <Alert
                        title={
                          <HelpWrapper>
                            <div className="title">
                              {translate("select.example")}{" "}
                              <strong>button</strong> {translate("containWord")}{" "}
                              <strong>Connect Wallet</strong> ,{" "}
                              {translate("pleaseEnter")}:
                            </div>

                            <div className="description">
                              <Code text={SAMPLE_XPATH} isWithCopy={true} />
                            </div>
                          </HelpWrapper>
                        }
                        type="info"
                        showIcon
                        className="help"
                      />
                    </Form.Item>
                  </Fragment>
                )}
              </>
            )}

            {/* ------ SELECT BY COORDINATES ------ */}
            {scrollSelector === SCROLL_TYPE.SCROLL_COORDINATES && (
              <>
                <div className="selectorMode">
                  <TagOption
                    content={
                      SCROLL_DIRECTION_NAME[SCROLL_DIRECTION.SCROLL_DOWN]
                    }
                    checked={scrollDirection === SCROLL_DIRECTION.SCROLL_DOWN}
                    onClick={() =>
                      setScrollDirection(SCROLL_DIRECTION.SCROLL_DOWN)
                    }
                    style={{ fontSize: "1.1rem" }}
                  />

                  <TagOption
                    content={SCROLL_DIRECTION_NAME[SCROLL_DIRECTION.SCROLL_UP]}
                    checked={scrollDirection === SCROLL_DIRECTION.SCROLL_UP}
                    onClick={() =>
                      setScrollDirection(SCROLL_DIRECTION.SCROLL_UP)
                    }
                    style={{ fontSize: "1.1rem" }}
                  />
                </div>

                <Form.Item
                  label={`${translate("workflow.yCoordinate")} (pixel):`}
                  name="yAxis"
                >
                  <InputNumber
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    defaultValue={0}
                  />
                </Form.Item>
              </>
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

export default Scroll;
