import _ from "lodash";
import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { NODE_ACTION } from "@/electron/simulator/constant";
import {
  ICampaign,
  IUpdateProfileNodeConfig,
  ColumnConfig,
} from "@/electron/type";
import { useTranslation } from "@/hook";
import { NODE_STATUS } from "@/electron/constant";
import { getCampaignAdditionalColumn } from "@/service/tableView";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IUpdateProfileNodeConfig) => void;
  config: IUpdateProfileNodeConfig;
  isModalOpen: boolean;
  selectedCampaign: ICampaign | null;
};

const UpdateProfile = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    selectedCampaign,
  } = props;

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
      columnVariable: config?.columnVariable,
      columnValue: config?.columnValue,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form, selectedCampaign]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        name,
        sleep,
        columnVariable,
        columnValue,
        onSuccess,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "name",
        "sleep",
        "columnVariable",
        "columnValue",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);

      const listColumn = getCampaignAdditionalColumn(selectedCampaign);
      const columnInfo: any =
        _.find(listColumn, { index: columnVariable }) || {};

      onSaveNodeConfig({
        name,
        sleep,
        columnVariable,
        columnValue,
        columnVariableName: columnInfo?.variable || "",
        status: NODE_STATUS.RUN,
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
              label={`${translate("campaign.column")}:`}
              name="columnVariable"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("campaign.columnPlaceholder")}
                size="large"
                className="custom-select"
                options={getCampaignAdditionalColumn(selectedCampaign)?.map(
                  (column: ColumnConfig) => ({
                    value: column?.dataIndex,
                    label: column?.title,
                  }),
                )}
                showSearch={false}
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.subColumnValue",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="columnValue" />
                </FormLabelWrapper>
              }
              name="columnValue"
            >
              <Input
                placeholder={translate("workflow.enterValue")}
                className="custom-input"
                size="large"
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting hideTimeout={true} />}

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

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
  }),
  {},
)(UpdateProfile);
