import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useTranslation } from "@/hook";
import {
  useGetListSetting,
  useCreateSetting,
  useUpdateSetting,
  useDeleteSetting,
} from "@/hook/setting";
import { SETTING_TYPE, ISetting } from "@/electron/type";
import { DeleteButton } from "@/component/Button";
import { TotalData } from "@/component";
import { EditIcon } from "@/component/Icon";
import { formatTimeToDate } from "@/service/util";
import { settingSelector } from "@/redux/setting";
import { RootState } from "@/redux/store";
import { Wrapper } from "./style";

interface Props {
  listSetting: ISetting[];
}

const WorkflowSetting = ({ listSetting }: Props) => {
  const { translate } = useTranslation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ISetting | null>(null);
  const [form] = Form.useForm();

  const { getListSetting, loading: isLoadLoading } = useGetListSetting();
  const { createSetting, loading: isCreateLoading } = useCreateSetting({
    onSuccess: () => setModalOpen(false),
  });
  const { updateSetting, loading: isUpdateLoading } = useUpdateSetting({
    onSuccess: () => setModalOpen(false),
  });
  const { deleteSetting, loading: isDeleteLoading } = useDeleteSetting({
    onSuccess: () => setSelectedRowKeys([]),
  });

  useEffect(() => {
    getListSetting({
      page: 1,
      pageSize: 1000,
      type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    });
  }, []);

  const onOpenCreate = () => {
    setSelectedItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const onOpenEdit = (item: ISetting) => {
    setSelectedItem(item);
    form.setFieldsValue({
      variable: item.name,
      label: item.workflowGlobalVariable?.label || "",
      value: item.workflowGlobalVariable?.value || "",
    });
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      form.resetFields();
    }, 300);
  };

  const onSubmit = async () => {
    try {
      await form.validateFields();
      const { variable, label, value } = form.getFieldsValue([
        "variable",
        "label",
        "value",
      ]);
      const data = JSON.stringify({ label: label || "", value: value || "" });

      if (selectedItem?.id) {
        updateSetting({ ...selectedItem, name: variable.trim(), data });
      } else {
        createSetting({
          name: variable.trim(),
          type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
          data,
        });
      }
    } catch {}
  };

  const onDelete = () => {
    deleteSetting(selectedRowKeys);
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
      title: translate("indexTable"),
      dataIndex: "index",
      width: "5%",
    },
    {
      title: translate("setting.variable"),
      dataIndex: "name",
      width: "23%",
    },
    {
      title: translate("setting.variableValue"),
      key: "value",
      width: "20%",
      render: (_: any, record: ISetting) =>
        record.workflowGlobalVariable?.value,
    },
    {
      title: translate("setting.variableLabel"),
      key: "label",
      width: "23%",
      render: (_: any, record: ISetting) =>
        record.workflowGlobalVariable?.label,
    },
    {
      title: translate("createdAt"),
      dataIndex: "createAt",
      width: "15%",
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
        size="middle"
        pagination={{ showTotal: onShowTotal, size: "small" }}
        scroll={{ x: 1300, y: "70vh" }}
      />

      <Modal
        title={
          selectedItem
            ? translate("setting.editGlobalVariable")
            : translate("setting.createGlobalVariable")
        }
        open={isModalOpen}
        onCancel={onCloseModal}
        onOk={onSubmit}
        okText={
          selectedItem
            ? translate("button.update")
            : translate("button.createNew")
        }
        cancelText={translate("cancel")}
        width={500}
        confirmLoading={isCreateLoading || isUpdateLoading}
      >
        <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
          <Form.Item
            label={`${translate("setting.variable")}:`}
            name="variable"
            rules={[
              { required: true, message: translate("form.requiredField") },
            ]}
          >
            <Input
              className="custom-input"
              placeholder={translate("setting.variablePlaceholder")}
              size="large"
              onInput={(event) =>
                ((event.target as HTMLInputElement).value = (
                  event.target as HTMLInputElement
                ).value
                  .toUpperCase()
                  .replaceAll(" ", ""))
              }
            />
          </Form.Item>

          <Form.Item
            label={`${translate("setting.variableValue")}:`}
            name="value"
          >
            <Input
              className="custom-input"
              placeholder={translate("setting.variableValuePlaceholder")}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label={`${translate("setting.variableLabel")}:`}
            name="label"
          >
            <Input
              className="custom-input"
              placeholder={translate("setting.variableLabelPlaceholder")}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Wrapper>
  );
};

const mapStateToProps = (state: RootState) => ({
  listSetting: settingSelector(state).listSetting,
});

export default connect(mapStateToProps)(WorkflowSetting);
