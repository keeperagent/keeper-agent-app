import { Form, Input } from "antd";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

const { TextArea } = Input;

const InfoForm = () => {
  const { translate } = useTranslation();

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
