import { useState, useEffect, useMemo } from "react";
import { Modal, Form, Spin, Tooltip, message } from "antd";
import CodeEditor from "@/component/CodeEditor";
import { connect } from "react-redux";
import copy from "copy-to-clipboard";
import { RootState } from "@/redux/store";
import { IWorkflowVariable } from "@/electron/type";
import { actSetModalAnalyzeVariableOpen } from "@/redux/workflowRunner";
import { EMPTY_STRING } from "@/config/constant";
import { useRunJavaScriptCode, useTranslation } from "@/hook";
import { CopyIcon, QuestionIcon } from "@/component/Icon";
import { Wrapper, CodeLabelWrapper } from "./style";

type IProps = {
  isModalAnalyzeVariableOpen: boolean;
  selectedVariable: IWorkflowVariable | null;
  actSetModalAnalyzeVariableOpen: (payload: {
    isModalAnalyzeVariableOpen: boolean;
    selectedVariable: IWorkflowVariable | null;
  }) => void;
};

let getResultTimeout: any = null;

const ModalAnalyzeValue = (props: IProps) => {
  const { isModalAnalyzeVariableOpen, selectedVariable } = props;
  const [codeValue, setCodeValue] = useState("");
  const { runJavaScriptCode, result, loading } = useRunJavaScriptCode();
  const [form] = Form.useForm();
  const { translate } = useTranslation();

  useEffect(() => {
    clearTimeout(getResultTimeout);
    getResultTimeout = setTimeout(() => {
      runJavaScriptCode(codeValue, selectedVariable ? [selectedVariable] : []);
    }, 500);
  }, [codeValue]);

  const onCloseModal = () => {
    props?.actSetModalAnalyzeVariableOpen({
      isModalAnalyzeVariableOpen: false,
      selectedVariable: null,
    });
  };

  const handleEditorChange = (value?: string) => {
    setCodeValue(value || "");
  };

  useEffect(() => {
    if (isModalAnalyzeVariableOpen && !codeValue) {
      const initialCode = `return ${selectedVariable?.variable || ""};`;
      setCodeValue(initialCode);
    }

    if (!isModalAnalyzeVariableOpen) {
      setCodeValue("");
    }
  }, [selectedVariable, isModalAnalyzeVariableOpen, codeValue]);

  const onCopyCode = () => {
    message.success(translate("copied"));
    copy(codeValue);
  };

  const isVariableValueIsObject = useMemo(() => {
    try {
      if (
        selectedVariable?.value &&
        typeof JSON.parse(selectedVariable?.value) === "object"
      ) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }, [selectedVariable?.value]);

  const isOutputValueIsObject = useMemo(() => {
    try {
      if (result && typeof JSON.parse(result) === "object") {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }, [result]);

  return (
    <Modal
      title={translate("workflow.analyzeVariableValue")}
      open={isModalAnalyzeVariableOpen}
      onCancel={onCloseModal}
      footer={null}
      destroyOnHidden={true}
      width="70rem"
      zIndex={4}
      maskClosable={false}
      style={{ top: "6rem" }}
    >
      <Wrapper>
        <Form layout="vertical" form={form}>
          <Form.Item
            label={
              <span>
                {translate("workflow.valueOfVariable")}{" "}
                <strong>{selectedVariable?.variable || EMPTY_STRING}:</strong>
              </span>
            }
          >
            <CodeEditor
              height="30rem"
              language={isVariableValueIsObject ? "json" : "markdown"}
              value={
                selectedVariable?.value && isVariableValueIsObject
                  ? selectedVariable?.value
                  : String(selectedVariable?.value || "")
              }
              readOnly
              className="code-editor"
              fontSize={13}
            />
          </Form.Item>

          <Form.Item
            label={
              <CodeLabelWrapper>
                <span className="label">
                  {translate("workflow.jsCodeToAnalyzeVariable")}:
                  <Tooltip
                    title={translate("workflow.jsCodeToAnalyzeVariableHelper")}
                    placement="top"
                  >
                    <span className="question-icon">
                      <QuestionIcon />
                    </span>
                  </Tooltip>
                </span>

                <Tooltip title={translate("workflow.copyCode")} placement="top">
                  <div className="icon" onClick={onCopyCode}>
                    <CopyIcon />
                  </div>
                </Tooltip>
              </CodeLabelWrapper>
            }
            style={{ marginTop: "4rem" }}
          >
            <CodeEditor
              height="10rem"
              language="javascript"
              value={codeValue}
              onChange={handleEditorChange}
              className="code-editor"
              fontSize={13}
            />
          </Form.Item>

          <Spin spinning={loading}>
            <Form.Item label="Output:">
              <CodeEditor
                height="20rem"
                language={isOutputValueIsObject ? "json" : "markdown"}
                value={
                  result && isOutputValueIsObject ? result : String(result)
                }
                readOnly
                className="code-editor"
                fontSize={13}
              />
            </Form.Item>
          </Spin>
        </Form>
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalAnalyzeVariableOpen:
      state?.WorkflowRunner?.isModalAnalyzeVariableOpen,
    selectedVariable: state?.WorkflowRunner?.selectedVariable,
  }),
  {
    actSetModalAnalyzeVariableOpen,
  },
)(ModalAnalyzeValue);
