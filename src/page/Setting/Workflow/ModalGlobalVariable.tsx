import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { useTranslation } from "@/hook";
import { useCreateSetting, useUpdateSetting } from "@/hook/setting";
import { SETTING_TYPE, ISetting } from "@/electron/type";

type IProps = {
  isModalOpen: boolean;
  selectedItem: ISetting | null;
  listSetting: ISetting[];
  onClose: () => void;
};

const ModalGlobalVariable = ({
  isModalOpen,
  selectedItem,
  listSetting,
  onClose,
}: IProps) => {
  const { translate } = useTranslation();
  const [form] = Form.useForm();

  const { createSetting, loading: isCreateLoading } = useCreateSetting({
    onSuccess: onClose,
  });
  const { updateSetting, loading: isUpdateLoading } = useUpdateSetting({
    onSuccess: onClose,
  });

  useEffect(() => {
    if (isModalOpen && selectedItem) {
      form.setFieldsValue({
        variable: selectedItem.name,
        label: selectedItem.workflowGlobalVariable?.label || "",
        value: selectedItem.workflowGlobalVariable?.value || "",
      });
    } else {
      form.resetFields();
    }
  }, [isModalOpen, selectedItem]);

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

  return (
    <Modal
      title={
        selectedItem
          ? translate("setting.editGlobalVariable")
          : translate("setting.createGlobalVariable")
      }
      open={isModalOpen}
      onCancel={onClose}
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
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.resolve();
                }
                const isDuplicated = listSetting.some(
                  (item) =>
                    item.name === value.trim().toUpperCase() &&
                    item.id !== selectedItem?.id,
                );
                if (isDuplicated) {
                  return Promise.reject(translate("form.duplicatedVariable"));
                }
                return Promise.resolve();
              },
            },
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
  );
};

export default ModalGlobalVariable;
