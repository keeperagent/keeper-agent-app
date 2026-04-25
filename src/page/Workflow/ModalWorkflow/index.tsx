import { useState, useEffect } from "react";
import { Modal, Form, Row, Button, Steps } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSaveSelectedWorkflow } from "@/redux/workflow";
import { useCreateWorkflow, useUpdateWorkflow, useTranslation } from "@/hook";
import { deleteItemInList, updateItemInList } from "@/service/util";
import { IWorkflowVariable } from "@/electron/type";
import InfoForm from "./InfoForm";
import ListVariable from "./ListVariable";

const defaultVariable: IWorkflowVariable = {
  variable: "",
  value: "",
};
const emptyListVariable: IWorkflowVariable[] = [defaultVariable];

const ModalWorkflow = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedWorkflow } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [listVariable, setListVariable] = useState<IWorkflowVariable[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const {
    updateWorkflow,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateWorkflow();
  const {
    createWorkflow,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateWorkflow();

  useEffect(() => {
    form.setFieldsValue({
      name: selectedWorkflow?.name || "",
      note: selectedWorkflow?.note || "",
    });
    setCurrentStep(0);
  }, [isModalOpen, form, selectedWorkflow]);

  useEffect(() => {
    if (!selectedWorkflow) {
      setListVariable(emptyListVariable);
    }

    if (selectedWorkflow) {
      setListVariable(
        selectedWorkflow?.listVariable?.length > 0
          ? selectedWorkflow?.listVariable
          : emptyListVariable,
      );
    }
  }, [isModalOpen, selectedWorkflow]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedWorkflow(null);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { name, note } = await form.validateFields(["name", "note"]);
      setBtnLoading(true);

      if (selectedWorkflow) {
        await updateWorkflow({
          name,
          note,
          listVariable,
          id: selectedWorkflow?.id,
        });
      } else {
        await createWorkflow({ name, note, listVariable, isFullScreen: true });
      }
    } catch { }
  };

  const goBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const goNextStep = async () => {
    try {
      await form.validateFields(["name", "note"]);
      setCurrentStep(currentStep + 1);
    } catch { }
  };

  const onChangeVariable = (variable: IWorkflowVariable, index: number) => {
    setListVariable(updateItemInList(index, listVariable, variable));
  };

  const onAddVariable = () => {
    setListVariable([...listVariable, { variable: "", value: "" }]);
  };

  const onRemoveVariable = (index: number) => {
    setListVariable(deleteItemInList(index, listVariable));
  };

  const onChangeStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedWorkflow
          ? translate("workflow.createWorkflow")
          : translate("workflow.editWorkflow")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedWorkflow
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="45rem"
      confirmLoading={isBtnLoading}
      style={{ top: "5rem" }}
      footer={
        <Row justify="end">
          {currentStep === 1 && (
            <Button
              onClick={goBackStep}
              style={{ marginRight: "var(--margin-right)" }}
            >
              {translate("back")}
            </Button>
          )}

          {currentStep === 0 && (
            <Button
              onClick={goNextStep}
              style={{ marginRight: "var(--margin-right)" }}
            >
              {translate("next")}
            </Button>
          )}

          <Button
            type="primary"
            onClick={onSubmitForm}
            loading={isCreateLoading || isUpdateLoading}
          >
            {selectedWorkflow
              ? translate("button.update")
              : translate("button.createNew")}
          </Button>
        </Row>
      }
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Steps
          onChange={onChangeStep}
          current={currentStep}
          labelPlacement="vertical"
          items={[
            {
              title: translate("info"),
            },
            {
              title: translate("config"),
            },
          ]}
          size="small"
          style={{ padding: "0 5rem", marginBottom: "var(--margin-bottom)" }}
        />

        {currentStep === 0 && <InfoForm />}
        {currentStep === 1 && (
          <ListVariable
            onChangeVariable={onChangeVariable}
            onAddVariable={onAddVariable}
            onRemoveVariable={onRemoveVariable}
            listVariable={listVariable}
          />
        )}
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  {
    actSaveSelectedWorkflow,
  },
)(ModalWorkflow);
