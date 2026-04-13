import {
  Button,
  Col,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Table,
} from "antd";
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useTranslation } from "@/hook";
import { useGetListSetting, useDeleteSetting } from "@/hook/setting";
import { useUpdatePreference } from "@/hook";
import { ISetting, IPreference, SETTING_TYPE } from "@/electron/type";
import ModalGlobalVariable from "./ModalGlobalVariable";
import { DeleteButton } from "@/component/Button";
import { TotalData } from "@/component";
import { EditIcon } from "@/component/Icon";
import { formatTimeToDate } from "@/service/util";
import { settingSelector } from "@/redux/setting";
import { RootState } from "@/redux/store";
import { Wrapper, OtherSettingsPanel } from "./style";

interface Props {
  listSetting: ISetting[];
  preference: IPreference | null;
}

const WorkflowSetting = ({ listSetting, preference }: Props) => {
  const { translate } = useTranslation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ISetting | null>(null);
  const [preferenceForm] = Form.useForm();

  const { getListSetting, loading: isLoadLoading } = useGetListSetting();
  const { deleteSetting, loading: isDeleteLoading } = useDeleteSetting({
    onSuccess: () => setSelectedRowKeys([]),
  });
  const {
    updatePreference,
    loading: isPreferenceLoading,
    isSuccess: isPreferenceSuccess,
  } = useUpdatePreference();

  useEffect(() => {
    getListSetting({
      page: 1,
      pageSize: 1000,
      type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    });
  }, []);

  useEffect(() => {
    preferenceForm.setFieldsValue({
      maxConcurrentJob: preference?.maxConcurrentJob,
    });
  }, [preference]);

  useEffect(() => {
    if (!isPreferenceLoading && isPreferenceSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [isPreferenceLoading, isPreferenceSuccess]);

  const onOpenCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const onOpenEdit = (item: ISetting) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const onDelete = () => {
    deleteSetting(selectedRowKeys);
  };

  const onSavePreference = async () => {
    try {
      const { maxConcurrentJob } = await preferenceForm.validateFields([
        "maxConcurrentJob",
      ]);
      await updatePreference({ id: preference?.id, maxConcurrentJob });
    } catch {}
  };

  const onShowTotal = () => {
    let text = `${translate("total")} ${listSetting.length} ${translate("data")}`;
    if (selectedRowKeys.length > 0) {
      text += `. ${selectedRowKeys.length} ${translate("data")} ${translate("selected")}`;
    }
    return <TotalData text={text} />;
  };

  const columns = [
    {
      title: translate("setting.variable"),
      key: "variable",
      width: "35%",
      render: (_: any, record: ISetting) => (
        <div>
          <div>{record.name}</div>
          {record.workflowGlobalVariable?.label && (
            <div className="cell-sub-label">
              {record.workflowGlobalVariable.label}
            </div>
          )}
        </div>
      ),
    },
    {
      title: translate("setting.variableValue"),
      key: "value",
      width: "30%",
      render: (_: any, record: ISetting) =>
        record.workflowGlobalVariable?.value,
    },
    {
      title: translate("createdAt"),
      dataIndex: "createAt",
      width: "23%",
      render: (value: number) => formatTimeToDate(value),
    },
    {
      title: "",
      dataIndex: "action",
      align: "center",
      fixed: "right",
      render: (_: any, record: ISetting) => (
        <div className="list-icon">
          <EditIcon onClick={() => onOpenEdit(record)} />
        </div>
      ),
    },
  ];

  const dataSource = listSetting.map((item, index) => ({
    ...item,
    index: index + 1,
  }));

  return (
    <Wrapper>
      <Row gutter={24} align="top">
        <Col span={16}>
          <div className="heading">
            <Button type="primary" size="middle" onClick={onOpenCreate}>
              {translate("button.create")}
            </Button>

            <Popconfirm
              title={
                <span style={{ width: "30rem", display: "block" }}>
                  {translate("confirmDelete")}
                </span>
              }
              onConfirm={onDelete}
              placement="left"
              disabled={selectedRowKeys.length === 0}
            >
              <span>
                <DeleteButton
                  text={translate("button.delete")}
                  loading={isDeleteLoading}
                />
              </span>
            </Popconfirm>
          </div>

          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: (keys: any) => setSelectedRowKeys(keys),
            }}
            rowKey={(record: ISetting) => record?.id!}
            dataSource={dataSource}
            // @ts-ignore
            columns={columns}
            loading={isLoadLoading}
            size="small"
            pagination={{ showTotal: onShowTotal, size: "small" }}
            scroll={{ x: 900, y: "60vh" }}
          />
        </Col>

        <Col span={8}>
          <OtherSettingsPanel>
            <div className="panel-title">
              {translate("setting.otherSetting")}
            </div>

            <Form layout="vertical" form={preferenceForm}>
              <Form.Item
                label={`${translate("setting.maxConcurrentWorkflow")}:`}
                name="maxConcurrentJob"
                rules={[
                  { required: true, message: translate("form.requiredField") },
                ]}
                tooltip={translate("setting.maxConcurrentWorkflowTooltip")}
              >
                <InputNumber
                  className="custom-input"
                  placeholder={translate(
                    "setting.maxConcurrentWorkflowPlaceholder",
                  )}
                  style={{ width: "100%" }}
                  min={1}
                  size="large"
                />
              </Form.Item>
            </Form>

            <Row justify="end">
              <Button
                type="primary"
                onClick={onSavePreference}
                loading={isPreferenceLoading}
              >
                {translate("save")}
              </Button>
            </Row>
          </OtherSettingsPanel>
        </Col>
      </Row>

      <ModalGlobalVariable
        isModalOpen={isModalOpen}
        selectedItem={selectedItem}
        listSetting={listSetting}
        onClose={onCloseModal}
      />
    </Wrapper>
  );
};

const mapStateToProps = (state: RootState) => ({
  listSetting: settingSelector(state).listSetting,
  preference: state?.Preference?.preference,
});

export default connect(mapStateToProps)(WorkflowSetting);
