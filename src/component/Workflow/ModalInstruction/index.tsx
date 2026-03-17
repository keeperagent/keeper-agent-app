import { Modal, Tabs } from "antd";
import { connect } from "react-redux";
import { useState } from "react";
import { RootState } from "@/redux/store";
import { actSetShowModalInstruction } from "@/redux/workflowRunner";
import { useTranslation } from "@/hook";
import NodeInstruction from "./NodeInstruction";
import DefaultVariable from "./DefaultVariable";

const TAB = {
  NODE_INSTRUCTION: "NODE_INSTRUCTION",
  LIST_VARIABLE: "LIST_VARIABLE",
};

const ModalInstruction = (props: any) => {
  const { isShowModalInstruction } = props;
  const { translate } = useTranslation();

  const [activeTab, setActiveTab] = useState(TAB.NODE_INSTRUCTION);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onCloseModal = () => {
    props?.actSetShowModalInstruction(false);
  };

  return (
    <Modal
      open={isShowModalInstruction}
      title={translate("guide")}
      onCancel={onCloseModal}
      mask={{ closable: true }}
      footer={null}
      width="120rem"
      style={{ top: "6rem" }}
    >
      <Tabs
        onChange={onChange}
        type="card"
        size="small"
        items={[
          {
            key: TAB.NODE_INSTRUCTION,
            label: translate("workflow.nodeInstruction"),
          },
          {
            key: TAB.LIST_VARIABLE,
            label: translate("workflow.listDefaultVariable"),
          },
        ]}
        activeKey={activeTab}
      />

      {activeTab === TAB.NODE_INSTRUCTION && <NodeInstruction />}
      {activeTab === TAB.LIST_VARIABLE && <DefaultVariable />}
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isShowModalInstruction: state?.WorkflowRunner?.isShowModalInstruction,
  }),
  {
    actSetShowModalInstruction,
  },
)(ModalInstruction);
