import { useEffect } from "react";
import { Modal, Checkbox, Alert } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { BookMarkIcon } from "@/component/Icon";
import { actSetModalPreferenceOpen } from "@/redux/workflowRunner";
import { actSetShowPreferenceHelpAlert } from "@/redux/preference";
import { useGetPreference, useTranslation, useUpdatePreference } from "@/hook";
import { IPreference } from "@/electron/type";
import { Wrapper, HelpWrapper } from "./style";
import Node from "../Node";
import { INode } from "../common";
import { getListNode, INodeGroup } from "../config";

type IProps = {
  isModalPreferenceOpen: boolean;
  actSetModalPreferenceOpen: (payload: boolean) => void;
  actSetShowPreferenceHelpAlert: (payload: boolean) => void;
  preference: IPreference | null;
  showPreferenceHelpAlert: boolean;
};

const ModalPreference = (props: IProps) => {
  const { isModalPreferenceOpen, preference, showPreferenceHelpAlert } = props;

  const { translate } = useTranslation();
  const { getPreference } = useGetPreference();
  const { updatePreference } = useUpdatePreference();

  const listNode = getListNode();

  useEffect(() => {
    if (isModalPreferenceOpen) {
      getPreference();
    }
  }, [isModalPreferenceOpen]);

  const onCloseModal = () => {
    props?.actSetModalPreferenceOpen(false);
  };

  const onChangeMinimapCheckbox = async (event: any) => {
    await updatePreference({
      ...preference,
      hideMinimap: event?.target?.checked,
    });
  };

  const onCloseAlert = () => {
    props?.actSetShowPreferenceHelpAlert(false);
  };

  return (
    <Modal
      open={isModalPreferenceOpen}
      title="Preference"
      footer={null}
      width="110rem"
      style={{ top: "3rem" }}
      onCancel={onCloseModal}
    >
      <Wrapper>
        <div className="item">
          <div className="label">
            {translate("workflow.customWhenRunningWorkflow")}
          </div>

          <div className="content" style={{ marginTop: "1rem" }}>
            <Checkbox
              checked={preference?.hideMinimap}
              onChange={onChangeMinimapCheckbox}
            >
              {translate("workflow.hideMiniMap")}
            </Checkbox>
          </div>
        </div>

        <div className="item">
          <div className="label">{translate("select.featureWantUse")}</div>

          {showPreferenceHelpAlert && (
            <Alert
              title={
                <HelpWrapper>
                  <span>{translate("workflow.preferencePrefixHelper")}</span>
                  <BookMarkIcon isActive={true} id="alert-true" />{" "}
                  <span>{translate("or")}</span>{" "}
                  <BookMarkIcon isActive={false} id="alert-false" />
                  <span>{translate("workflow.preferenceSufixHelper")}</span>
                </HelpWrapper>
              }
              type="warning"
              showIcon
              className="help"
              closable
              onClose={onCloseAlert}
            />
          )}

          <div className="content list-node-wrapper">
            {listNode?.map((group: INodeGroup, groupIndex: number) => (
              <div key={groupIndex} className="group">
                <div className="label">{group?.label}</div>

                <div className="list-node">
                  {group?.children?.map((node: INode, index: number) => (
                    <div
                      className="node-wrapper"
                      key={`${groupIndex}-${index}`}
                    >
                      <Node
                        node={node}
                        key={`${groupIndex}-${index}`}
                        draggable={false}
                        isActive={
                          !preference?.nodeBlackList?.includes(
                            node?.config?.workflowType!,
                          )
                        }
                        showBookMark={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalPreferenceOpen: state?.WorkflowRunner.isModalPreferenceOpen,
    preference: state?.Preference?.preference,
    showPreferenceHelpAlert: state?.Preference?.showPreferenceHelpAlert,
  }),
  {
    actSetModalPreferenceOpen,
    actSetShowPreferenceHelpAlert,
  },
)(ModalPreference);
