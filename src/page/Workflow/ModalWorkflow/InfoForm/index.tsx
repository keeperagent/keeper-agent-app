import { useEffect } from "react";
import { Form, Input, Select } from "antd";
import { useGetListWorkflowGroup, useTranslation } from "@/hook";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Wrapper } from "./style";

const { TextArea } = Input;
const PAGE_SIZE = 1000;

const InfoForm = () => {
  const { translate } = useTranslation();
  const { getListWorkflowGroup } = useGetListWorkflowGroup();
  const listWorkflowGroup = useSelector(
    (state: RootState) => state?.WorkflowGroup?.listWorkflowGroup,
  );

  useEffect(() => {
    getListWorkflowGroup({
      page: 1,
      pageSize: PAGE_SIZE,
    });
  }, []);

  return (
    <Wrapper>
      <Form.Item
        label={`${translate("workflow.name")}:`}
        name="name"
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <Input
          placeholder={translate("workflow.enterNameWorkflow")}
          className="custom-input"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={`${translate("workflow.workflowGroup")}:`}
        name="groupId"
      >
        <Select
          className="custom-select"
          placeholder={translate("workflow.selectWorkflowGroup")}
          allowClear
          size="large"
          options={listWorkflowGroup?.map((group) => ({
            label: group?.name,
            value: group?.id,
          }))}
        />
      </Form.Item>

      <Form.Item label={`${translate("note")}:`} name="note">
        <TextArea
          placeholder={translate("enterNote")}
          rows={3}
          className="custom-input"
        />
      </Form.Item>
    </Wrapper>
  );
};

export default InfoForm;
