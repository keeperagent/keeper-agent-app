import { useEffect, useRef, Fragment, useState } from "react";
import { Modal, Form, InputNumber } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useUpdateWorkflow } from "@/hook";
import { TagOption } from "@/component";
import { actSaveSelectedWorkflow } from "@/redux/workflow";
import { actSetShowModalSetting } from "@/redux/workflowRunner";
import { IWorkflow } from "@/electron/type";
import { Wrapper } from "./style";

const defaultScreenSize = {
  width: 500,
  height: 800,
};

type IProps = {
  isModalSettingOpen: boolean;
  selectedWorkflow: IWorkflow | null;
  actSaveSelectedWorkflow: (payload: IWorkflow | null) => void;
  actSetShowModalSetting: (payload: boolean) => void;
};

const ModalWorkflowSetting = (props: IProps) => {
  const { isModalSettingOpen, selectedWorkflow } = props;
  const [isFullScreen, setFullScreen] = useState(true);
  const { translate } = useTranslation();
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateWorkflow, loading, isSuccess } = useUpdateWorkflow();

  useEffect(() => {
    form.setFieldsValue({
      numberOfThread: selectedWorkflow?.numberOfThread || 1,
      numberOfRound: selectedWorkflow?.numberOfRound || 1,
      windowWidth: selectedWorkflow?.windowWidth || defaultScreenSize?.width,
      windowHeight: selectedWorkflow?.windowHeight || defaultScreenSize?.height,
    });
    setFullScreen(
      selectedWorkflow?.isFullScreen !== undefined
        ? Boolean(selectedWorkflow?.isFullScreen)
        : true,
    );
  }, [selectedWorkflow, isModalSettingOpen]);

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();

      const { numberOfThread, numberOfRound, windowWidth, windowHeight } =
        form.getFieldsValue([
          "numberOfThread",
          "numberOfRound",
          "windowWidth",
          "windowHeight",
        ]);
      props?.actSaveSelectedWorkflow({
        ...selectedWorkflow,
        numberOfThread,
        numberOfRound,
        windowWidth,
        windowHeight,
        isFullScreen,
      });
    }
  }, [loading, isSuccess]);

  const onCloseModal = () => {
    props?.actSetShowModalSetting(false);
  };

  const onSubmitForm = async () => {
    try {
      const { numberOfThread, numberOfRound, windowWidth, windowHeight } =
        await form.validateFields([
          "numberOfThread",
          "numberOfRound",
          ...(isFullScreen ? [] : ["windowWidth", "windowHeight"]),
        ]);

      updateWorkflow({
        numberOfThread,
        numberOfRound,
        windowWidth: isFullScreen ? selectedWorkflow?.windowWidth : windowWidth,
        windowHeight: isFullScreen
          ? selectedWorkflow?.windowHeight
          : windowHeight,
        isFullScreen,
        id: selectedWorkflow?.id,
      });
    } catch {}
  };

  return (
    <Modal
      open={isModalSettingOpen}
      title={translate("workflow.configToRunWorkflow")}
      okText={
        !selectedWorkflow
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="50rem"
      onCancel={onCloseModal}
      onOk={onSubmitForm}
    >
      <Wrapper>
        <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
          <Form.Item
            label={`${translate("campaign.numberOfThread")}:`}
            name="numberOfThread"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <InputNumber
              placeholder={translate("campaign.numberOfThreadPlaceholder")}
              className="custom-input"
              size="large"
              style={{ width: "100%" }}
              // @ts-ignore
              ref={inputRef}
              min={1}
            />
          </Form.Item>

          <Form.Item
            label={`${translate("workflow.numberOfLoop")}:`}
            name="numberOfRound"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <InputNumber
              placeholder={translate("workflow.egNumberOfLoop")}
              className="custom-input"
              size="large"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>

          <Form.Item label="Layout:" name="layout">
            <div className="mode">
              <TagOption
                content={translate("campaign.fullScreen")}
                checked={isFullScreen}
                onClick={() => setFullScreen(true)}
                style={{ fontSize: "1.1rem" }}
              />

              <TagOption
                content={translate("campaign.customScreenSize")}
                checked={!isFullScreen}
                onClick={() => setFullScreen(false)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>
          </Form.Item>

          {!isFullScreen && (
            <Fragment>
              <Form.Item
                label={`${translate("campaign.windowWidth")}`}
                name="windowWidth"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
                style={{ marginTop: "-1.5rem" }}
              >
                <InputNumber
                  placeholder={translate("campaign.windowWidthPlaceholder")}
                  className="custom-input"
                  size="large"
                  // @ts-ignore
                  ref={inputRef}
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>

              <Form.Item
                label={`${translate("campaign.windowHeight")}:`}
                name="windowHeight"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
                style={{ width: "100%" }}
              >
                <InputNumber
                  placeholder={translate("campaign.windowHeightPlaceholder")}
                  className="custom-input"
                  size="large"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Fragment>
          )}
        </Form>
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    isModalSettingOpen: state?.WorkflowRunner?.isModalSettingOpen,
  }),
  { actSaveSelectedWorkflow, actSetShowModalSetting },
)(ModalWorkflowSetting);
