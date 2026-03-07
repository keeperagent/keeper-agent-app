import { useEffect, useRef } from "react";
import { Form, Input, FormInstance } from "antd";
import { useTranslation } from "@/hook";

const { TextArea } = Input;

type IInfoFormProps = {
  form: FormInstance;
};

const InfoForm = (props: IInfoFormProps) => {
  const { translate } = useTranslation();
  const { form } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 100);
  }, []);

  return (
    <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
      <Form.Item
        label={`${translate("groupName")}:`}
        name="name"
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <Input
          placeholder={translate("enterGroupName")}
          className="custom-input"
          size="large"
          // @ts-ignore
          ref={inputRef}
        />
      </Form.Item>

      <Form.Item label={`${translate("describe")}:`} name="note">
        <TextArea
          placeholder={translate("enterDescribe")}
          rows={3}
          className="custom-input"
        />
      </Form.Item>
    </Form>
  );
};

export default InfoForm;
