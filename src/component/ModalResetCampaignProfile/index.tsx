import { useEffect, useState } from "react";
import { Modal, Form, Checkbox, Radio, Space, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  ICampaign,
  ICampaignProfile,
  ColumnConfig,
  IWorkflow,
} from "@/electron/type";
import {
  useUpdateListCampaignProfile,
  useTranslation,
  useGetCampaignProfileStatus,
} from "@/hook";
import { getCampaignAdditionalColumn } from "@/service/tableView";

type IProps = {
  isModalOpen: boolean;
  setModalOpen: (payload: boolean) => void;
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  setShouldRefetch?: (payload: boolean) => void;
  selectedRowKeys?: number[];
  isResetAll?: boolean;
};

const RESET_FIELD_NAME = {
  ROUND: "ROUND",
  ADDITIONAL_COLUMN: "ADDITIONAL_COLUMN",
  IS_RUNNING: "IS_RUNNING",
  ACTIVE_ALL_PROFILE: "ACTIVE_ALL_PROFILE",
  DEACTIVE_ALL_PROFILE: "DEACTIVE_ALL_PROFILE",
};

const ModalResetCampaignProfile = (props: IProps) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedCampaign,
    selectedRowKeys,
    setShouldRefetch,
    isResetAll = false,
    selectedWorkflow,
  } = props;
  const [listField, setListField] = useState<string[]>([]);
  const [form] = Form.useForm();

  const { updateListCampaignProfile, loading, isSuccess } =
    useUpdateListCampaignProfile();
  const { getCampaignProfileStatus } = useGetCampaignProfileStatus();

  useEffect(() => {
    form.setFieldsValue({
      resetAll: isResetAll,
      listField: [RESET_FIELD_NAME.ROUND, RESET_FIELD_NAME.IS_RUNNING],
      listColumn: [],
    });
    setListField([RESET_FIELD_NAME.ROUND]);
  }, [isModalOpen]);

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
      setShouldRefetch && setShouldRefetch(true);
      getCampaignProfileStatus(
        selectedCampaign?.id || 0,
        selectedWorkflow?.id || 0,
      );
    }
  }, [loading, isSuccess, selectedCampaign, selectedWorkflow]);

  const onChangeField = (value: any) => {
    setListField(value);
  };

  const onSubmit = async () => {
    try {
      let { resetAll, listField, listColumn } = await form.validateFields([
        "resetAll",
        "listField",
        "listColumn",
      ]);
      let profile: ICampaignProfile = {};

      if (isResetAll) {
        resetAll = isResetAll;
      }

      let listUpdateID: number[] = [];
      if (!resetAll) {
        listUpdateID = selectedRowKeys || [];
      }

      if (listField?.includes(RESET_FIELD_NAME.ROUND)) {
        profile = {
          ...profile,
          round: 0,
        };
      }
      if (listField?.includes(RESET_FIELD_NAME.IS_RUNNING)) {
        profile = {
          ...profile,
          isRunning: false,
        };
      }
      if (listField?.includes(RESET_FIELD_NAME.ADDITIONAL_COLUMN)) {
        listColumn?.forEach((dataIndex: string) => {
          profile = {
            ...profile,
            [dataIndex]: "",
          };
        });
      }
      if (listField?.includes(RESET_FIELD_NAME.ACTIVE_ALL_PROFILE)) {
        profile = {
          ...profile,
          isActive: true,
        };
      }
      if (listField?.includes(RESET_FIELD_NAME.DEACTIVE_ALL_PROFILE)) {
        profile = {
          ...profile,
          isActive: false,
        };
      }

      updateListCampaignProfile({
        listID: listUpdateID,
        profile,
        resetAll,
        campaignId: selectedCampaign?.id!,
      });
    } catch {}
  };

  const onCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("campaign.resetData")}
      onCancel={onCloseModal}
      onOk={onSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" style={{ marginTop: "2rem" }}>
        <Form.Item
          name="resetAll"
          label={
            <span
              style={{
                fontSize: "1.1rem",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              {translate("campaign.dataToReset")}
            </span>
          }
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Radio.Group>
            <Space orientation="vertical">
              <Radio value={false} disabled={isResetAll}>
                {translate("campaign.resetSelectedData")}
              </Radio>
              <Radio value={true}> {translate("campaign.resetAllData")}</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="listField"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
          label={
            <span
              style={{
                fontSize: "1.1rem",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              {translate("campaign.fieldReset")}
            </span>
          }
        >
          <Checkbox.Group onChange={onChangeField}>
            <Space orientation="vertical">
              <Checkbox value={RESET_FIELD_NAME.ROUND}>
                {translate("campaign.round")}
              </Checkbox>
              <Checkbox value={RESET_FIELD_NAME.IS_RUNNING}>
                {translate("status")}
              </Checkbox>
              <Checkbox value={RESET_FIELD_NAME.ACTIVE_ALL_PROFILE}>
                {translate("campaign.activeAllProfile")}
              </Checkbox>
              <Checkbox value={RESET_FIELD_NAME.DEACTIVE_ALL_PROFILE}>
                {translate("campaign.deActiveAllProfile")}
              </Checkbox>
              <Checkbox value={RESET_FIELD_NAME.ADDITIONAL_COLUMN}>
                {translate("campaign.additionalColumn")}
              </Checkbox>
            </Space>
          </Checkbox.Group>
        </Form.Item>

        {listField?.includes(RESET_FIELD_NAME.ADDITIONAL_COLUMN) && (
          <Form.Item
            label={`${translate("campaign.column")}:`}
            name="listColumn"
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
              mode="multiple"
              showSearch={false}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  {},
)(ModalResetCampaignProfile);
