import { useRef, useEffect, Fragment } from "react";
import { Form, InputNumber, Radio, Checkbox, Input } from "antd";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

type IProps = {
  hideTimeout?: boolean;
  hideWaitingTime?: boolean;
  hideCondition?: boolean;
  hideTelegramCheckbox?: boolean;
  hideRetry?: boolean;
  hideMaxConcurrency?: boolean;
};

const CommonSetting = (props: IProps) => {
  const {
    hideTimeout,
    hideWaitingTime,
    hideCondition,
    hideTelegramCheckbox,
    hideRetry,
    hideMaxConcurrency,
  } = props;

  const { translate } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 100);
  }, []);

  return (
    <Wrapper>
      {!hideTelegramCheckbox && (
        <Form.Item name="alertTelegramWhenError" valuePropName="checked">
          <Checkbox>{translate("campaign.notifyTelegramWhenError")}</Checkbox>
        </Form.Item>
      )}

      <Form.Item label={`${translate("workflow.nameLabel")}:`} name="name">
        <Input
          placeholder={translate("workflow.enterNameLabel")}
          className="custom-input"
          size="large"
          // @ts-ignore
          ref={inputRef}
        />
      </Form.Item>

      {!hideWaitingTime && (
        <Form.Item label={`${translate("workflow.sleepTime")}:`} name="sleep">
          <InputNumber
            placeholder={translate("workflow.placeholderSleepTime")}
            className="custom-input"
            size="large"
            style={{ width: "100%" }}
            min={0}
          />
        </Form.Item>
      )}

      {!hideTimeout && (
        <Form.Item
          label={`${translate("workflow.timeoutLabel")}:`}
          name="timeout"
        >
          <InputNumber
            placeholder={translate("workflow.placeholderSleepTime")}
            className="custom-input"
            size="large"
            style={{ width: "100%" }}
            min={3}
          />
        </Form.Item>
      )}

      {!hideRetry && (
        <Form.Item
          label={`${translate("workflow.retryLabel")}:`}
          name="retry"
          tooltip={translate("workflow.retryTooltip")}
        >
          <InputNumber
            className="custom-input"
            size="large"
            style={{ width: "100%" }}
            min={0}
          />
        </Form.Item>
      )}

      {!hideMaxConcurrency && (
        <Form.Item
          label={`${translate("workflow.maxConcurrency")}:`}
          name="maxConcurrency"
          tooltip={translate("workflow.maxConcurrencyTooltip")}
          initialValue={0}
        >
          <InputNumber
            className="custom-input"
            size="large"
            style={{ width: "100%" }}
            min={0}
            placeholder={translate("workflow.maxConcurrencyPlaceholder")}
          />
        </Form.Item>
      )}

      {!hideCondition && (
        <Fragment>
          <div className="condition success">on success</div>
          <Form.Item name="onSuccess">
            <Radio.Group style={{ display: "flex", flexDirection: "column" }}>
              <Radio value={NODE_ACTION.CONTINUE_RUN}>
                {translate("workflow.continueRunThread")}
              </Radio>
              <Radio value={NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE}>
                {translate("workflow.closeBrowserAndMarkDone")}
              </Radio>
            </Radio.Group>
          </Form.Item>

          <div className="condition error">on error</div>
          <Form.Item name="onError">
            <Radio.Group style={{ display: "flex", flexDirection: "column" }}>
              <Radio value={NODE_ACTION.CONTINUE_RUN}>
                {translate("workflow.continueRunThread")}
              </Radio>
              <Radio value={NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE}>
                {translate("workflow.closeBrowserAndMarkDone")}
              </Radio>
              <Radio value={NODE_ACTION.RERUN_THREAD}>
                {translate("workflow.rerunThread")}
              </Radio>
              <Radio value={NODE_ACTION.PAUSE_THREAD}>
                {translate("workflow.pauseThread")}
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Fragment>
      )}
    </Wrapper>
  );
};

export default CommonSetting;
