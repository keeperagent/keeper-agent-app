import { Input, Row, Col, Tooltip } from "antd";
import { IKeyValue } from "@/electron/type";
import { MinusCircleIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { ItemWrapper } from "./style";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";

type IProps = {
  keyValue: IKeyValue;
  onChangeKeyValue: (keyValue: IKeyValue, index: number) => void;
  onRemoveKeyValue: (index: number) => void;
  index: number;
};

const KeyValue = (props: IProps) => {
  const { keyValue, onChangeKeyValue, onRemoveKeyValue, index } = props;
  const { translate } = useTranslation();

  const onChangeKey = (key: string) => {
    onChangeKeyValue({ ...keyValue, key }, index);
  };

  const onChangeValue = (value: string) => {
    onChangeKeyValue({ ...keyValue, value }, index);
  };

  return (
    <ItemWrapper>
      <Row gutter={16} align="bottom">
        <Col span={12}>
          <div className="input-item">
            <div className="label">
              <span>Key:</span>
            </div>

            <div className="input-wrapper">
              <Input
                placeholder={translate("workflow.enterKey")}
                className="custom-input"
                size="middle"
                onChange={(event) => onChangeKey(event?.target?.value)}
                value={keyValue?.key}
              />
            </div>
          </div>
        </Col>

        <Col span={12}>
          <div className="input-item">
            <div className="label">
              <span>Value:</span>
              <WorkflowVariable onChange={onChangeValue} />

              <Tooltip title={translate("remove")}>
                <div
                  className="remove-icon"
                  onClick={() => onRemoveKeyValue(index)}
                >
                  <MinusCircleIcon />
                </div>
              </Tooltip>
            </div>

            <div className="input-wrapper">
              <Input
                placeholder={translate("workflow.enterValue")}
                className="custom-input"
                size="middle"
                onChange={(event) => onChangeValue(event?.target?.value)}
                value={keyValue?.value}
              />
            </div>
          </div>
        </Col>
      </Row>
    </ItemWrapper>
  );
};

export { KeyValue };
