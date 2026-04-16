import { Fragment } from "react";
import { Alert, Form, Input, Row, Col, Select, FormInstance } from "antd";
import { TagOption } from "@/component";
import { useTranslation } from "@/hook";
import { COMPARISION_EXPRESSION } from "@/electron/constant";
import { Wrapper } from "./style";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";

const listCondition = (translate: (key: string) => string) => [
  { value: COMPARISION_EXPRESSION.LARGER, label: translate("isGreaterThan") },
  { value: COMPARISION_EXPRESSION.SMALLER, label: translate("isLessThan") },
  { value: COMPARISION_EXPRESSION.EQUAL, label: translate("isEqual") },
  { value: COMPARISION_EXPRESSION.NOT_EQUAL, label: translate("isNotEqual") },
];

type IProps = {
  form: FormInstance;
  setIsSkip: (value: boolean) => void;
  isSkip: boolean;
};

const SkipSetting = (props: IProps) => {
  const { form, setIsSkip, isSkip } = props;
  const { translate } = useTranslation();

  return (
    <Wrapper>
      <Alert
        title={
          <span>
            {translate("workflow.skipNode.helper1")}{" "}
            <strong>{translate("workflow.skipThisNode")}</strong>{" "}
            {translate("workflow.skipNode.helper2")}
          </span>
        }
        type="info"
        showIcon
        className="help"
      />

      <div className="mode">
        <TagOption
          content={translate("workflow.doNotSkip")}
          checked={!isSkip}
          onClick={() => setIsSkip(false)}
          style={{ fontSize: "1.1rem" }}
        />

        <TagOption
          content={translate("workflow.skipThisNode")}
          checked={isSkip}
          onClick={() => setIsSkip(true)}
          style={{ fontSize: "1.1rem" }}
        />
      </div>

      {isSkip && (
        <Fragment>
          <Form.Item
            label={
              <FormLabelWrapper>
                <span className="text">{translate("skipThisNodeIf")}: </span>
                <WorkflowVariable form={form} fieldName="leftSide" />
              </FormLabelWrapper>
            }
            name="leftSide"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <Input
              placeholder={translate("workflow.enterObjectToCompare")}
              className="custom-input"
              size="large"
            />
          </Form.Item>

          <Row gutter={8}>
            <Col span={10}>
              <Form.Item
                label={`${translate("workflow.condition")}:`}
                name="condition"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
              >
                <Select
                  className="custom-select"
                  placeholder={translate("workflow.selectCondition")}
                  size="large"
                  options={listCondition(translate)?.map((condition: any) => ({
                    value: condition?.value,
                    label: condition?.label,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={14}>
              <Form.Item
                label={
                  <FormLabelWrapper>
                    <WorkflowVariable form={form} fieldName="rightSide" />
                  </FormLabelWrapper>
                }
                name="rightSide"
              >
                <Input
                  placeholder={translate("workflow.enterValueToCompare")}
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Fragment>
      )}
    </Wrapper>
  );
};

export default SkipSetting;
