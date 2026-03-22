import { Fragment, useState, useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  FormInstance,
  Switch,
  Checkbox,
  InputNumber,
} from "antd";
import { connect } from "react-redux";
import cronstrue from "cronstrue";
import { useTranslation } from "@/hook";
import { SCHEDULE_REPEAT, SCHEDULE_REPEAT_PER_DAY } from "@/electron/constant";
import { RootState } from "@/redux/store";
import { ScheduleType } from "@/electron/type";
import { actSetModalOpen } from "@/redux/schedule";
import { Wrapper } from "./style";

const { TextArea } = Input;

interface IProps {
  form: FormInstance;
  repeatPerDay: string;
  setRepeatPerDay: (value: string) => void;
  repeatMode: string;
  setRepeatMode: (value: string) => void;
  scheduleType?: string;
}

const { Option } = Select;

const InfoForm = (props: IProps) => {
  const {
    form,
    repeatPerDay,
    setRepeatPerDay,
    repeatMode,
    setRepeatMode,
    scheduleType,
  } = props;
  const { translate } = useTranslation();
  const isAgentSchedule = scheduleType === ScheduleType.AGENT;
  const [cronPreview, setCronPreview] = useState("");

  const onChangeCronExpr = (value: string) => {
    try {
      setCronPreview(cronstrue.toString(value));
    } catch {
      setCronPreview("");
    }
  };

  useEffect(() => {
    const currentCron = form.getFieldValue("cronExpr");
    if (currentCron) {
      onChangeCronExpr(currentCron);
    }
  }, []);

  const onChangeRepeatPerDay = (value: string) => {
    setRepeatPerDay(value);
  };

  const onChangeRepeatMode = (value: string) => {
    setRepeatMode(value);
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("name")}:`}
          name="name"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Input
            placeholder={translate("schedule.namePlaceholder")}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        {isAgentSchedule ? (
          <Form.Item
            label={`${translate("schedule.cronExpr")}:`}
            name="cronExpr"
            rules={[
              { required: true, message: translate("form.requiredField") },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  try {
                    cronstrue.toString(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(translate("schedule.invalidCron"));
                  }
                },
              },
            ]}
          >
            <Input
              placeholder="* * * * *"
              className="custom-input"
              size="large"
              onChange={(e) => onChangeCronExpr(e.target.value)}
            />
          </Form.Item>
        ) : (
          <Fragment>
            <Form.Item
              label={`${translate("schedule.startTime")}:`}
              name="pickerTime"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <DatePicker
                picker="time"
                placeholder={translate("schedule.startTimePlaceholder")}
                className="custom-date-picker"
                size="large"
                style={{ width: "100%" }}
                format="HH:mm"
              />
            </Form.Item>

            <Form.Item
              label={`${translate("schedule.repeatMode")}:`}
              name="repeat"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Select
                placeholder={translate("schedule.repeatModePlaceholder")}
                size="large"
                className="custom-select"
                onChange={onChangeRepeatMode}
              >
                <Option key={SCHEDULE_REPEAT.NO_REPEAT}>
                  {translate("schedule.noRepeat")}
                </Option>
                <Option key={SCHEDULE_REPEAT.EVERY_DAY}>
                  {translate("schedule.everyDay")}
                </Option>
                <Option key={SCHEDULE_REPEAT.ODD_DAY}>
                  {translate("schedule.oddDay")}
                </Option>
                <Option key={SCHEDULE_REPEAT.EVEN_DAY}>
                  {translate("schedule.evenDay")}
                </Option>
              </Select>
            </Form.Item>

            {repeatMode !== SCHEDULE_REPEAT.NO_REPEAT && (
              <Form.Item
                label={`${translate("schedule.repeatPerDay")}:`}
                name="repeatPerDay"
                rules={[
                  { required: true, message: translate("form.requiredField") },
                ]}
              >
                <Select
                  size="large"
                  className="custom-select"
                  onChange={onChangeRepeatPerDay}
                >
                  <Option key={SCHEDULE_REPEAT_PER_DAY.ONCE_PER_DAY}>
                    {translate("schedule.oncePerDay")}
                  </Option>
                  <Option key={SCHEDULE_REPEAT_PER_DAY.MANY_TIME_PER_DAY}>
                    {translate("schedule.manyTimesPerDay")}
                  </Option>
                </Select>
              </Form.Item>
            )}

            {repeatPerDay === SCHEDULE_REPEAT_PER_DAY.MANY_TIME_PER_DAY && (
              <Form.Item
                label={`${translate("schedule.durationBetweenRun")}:`}
                name="durationBetweenRun"
                rules={[
                  { required: true, message: translate("form.requiredField") },
                ]}
              >
                <InputNumber
                  placeholder={translate(
                    "schedule.durationBetweenRunPlaceholder",
                  )}
                  className="custom-input-number"
                  size="large"
                  min={0}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}
          </Fragment>
        )}

        {isAgentSchedule && cronPreview && (
          <div className="cron-preview">{cronPreview}</div>
        )}

        <Form.Item label={`${translate("describe")}:`} name="note">
          <TextArea
            placeholder={translate("enterDescribe")}
            rows={3}
            className="custom-input"
          />
        </Form.Item>

        <Form.Item name="alertTelegram" valuePropName="checked">
          <Checkbox className="checkbox">
            {translate("schedule.alertTelegram")}
          </Checkbox>
        </Form.Item>

        <Form.Item label="Active?" valuePropName="checked" name="isActive">
          <Switch
            checkedChildren="On"
            unCheckedChildren="Off"
            style={{ marginTop: "-1rem" }}
          />
        </Form.Item>
      </Form>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    selectedSchedule: state?.Schedule?.selectedSchedule,
    isModalOpen: state?.Schedule?.isModalOpen,
  }),
  { actSetModalOpen },
)(InfoForm);
