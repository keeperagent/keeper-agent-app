import { useEffect, useRef } from "react";
import { Form, Input, FormInstance } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";

import { FormWrapper } from "./style";
import { useTranslation } from "@/hook";

const { TextArea } = Input;

type IInfoFormProps = {
  form: FormInstance;
  isModalOpen: boolean;
};

const InfoForm = (props: IInfoFormProps) => {
  const { translate } = useTranslation();
  const { form, isModalOpen } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  return (
    <FormWrapper>
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
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listExtension: state?.Extension?.listExtension,
  }),
  {}
)(InfoForm);
