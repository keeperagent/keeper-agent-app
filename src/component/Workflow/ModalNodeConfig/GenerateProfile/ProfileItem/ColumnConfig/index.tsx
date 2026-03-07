import { ChangeEvent, useMemo, useEffect, useRef } from "react";
import { Input, Badge, Tooltip } from "antd";
import { COLORS } from "@/config/constant";
import { CheckIcon, CopyBoldIcon, TrashBoldIcon } from "@/component/Icon";
import { IFakeProfile, IWorkflowVariable } from "@/electron/type";
import { useTranslation } from "@/hook";
import { ColumnWrapper } from "./style";

type IColumnConfigProps = {
  index: number;
  activeCol: number | null;
  setActiveCol: (value: number | null) => void;
  activeProfile: number | null;
  setActiveProfile: (value: number | null) => void;
  attribute: IWorkflowVariable;
  onChangeProfile: (profile: IFakeProfile, index: number) => void;
  onDuplicateAttribute: (
    attributeIndex: number,
    attribute: IWorkflowVariable,
  ) => void;
  onChangeAttribute: (
    attributeIndex: number,
    attribute: IWorkflowVariable,
  ) => void;
  onRemoveAttribute: (attributeIndex: number) => void;
  profileIndex: number;
  allowDelete: boolean;
};

const ColumnConfig = (props: IColumnConfigProps) => {
  const {
    index,
    profileIndex,
    activeCol,
    setActiveCol,
    setActiveProfile,
    attribute,
    onDuplicateAttribute,
    onChangeAttribute,
    onRemoveAttribute,
    activeProfile,
    allowDelete,
  } = props;
  const { translate } = useTranslation();
  const elementRef = useRef<HTMLDivElement>(null);

  const isActive = useMemo(() => {
    return activeCol === index && activeProfile === profileIndex;
  }, [activeCol, activeProfile, index]);

  useEffect(() => {
    if (elementRef && isActive) {
      elementRef?.current?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  }, [isActive]);

  const isValid = useMemo(() => {
    return attribute?.variable;
  }, [attribute?.variable]);

  const onClick = () => {
    if (activeCol !== index) {
      setActiveCol(index);
    }

    if (activeProfile !== profileIndex) {
      setActiveProfile(profileIndex);
    }
  };

  const onChangeVariableName = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeAttribute(index, {
      ...attribute,
      variable: event?.target?.value?.toUpperCase(),
    });
  };

  const onChangeValue = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeAttribute(index, { ...attribute, value: event.target.value });
  };

  const namePlaceholder = useMemo(() => {
    if (index === 0) {
      return translate("resource.exampleVariableName");
    } else if (index === 1) {
      return translate("resource.exampleVariableName_1");
    } else if (index === 2) {
      return translate("resource.exampleVariableName_2");
    }

    return translate("resource.exampleVariableName_3");
  }, [index]);

  const labelPlaceholder = useMemo(() => {
    if (index === 0) {
      return translate("resource.exampleVariableLabel");
    } else if (index === 1) {
      return translate("resource.exampleVariableLabel_1");
    } else if (index === 2) {
      return translate("resource.exampleVariableLabel_2");
    }

    return translate("resource.exampleVariableLabel_3");
  }, [index]);

  return (
    <ColumnWrapper className={isActive ? "active" : ""} ref={elementRef}>
      <div className="heading">
        <div className="col-label">
          <Badge
            count={`${translate("attribute")} ${index + 1}`}
            size="small"
            color={COLORS[index % COLORS.length]}
          />
        </div>

        <div className="tool">
          {isValid && (
            <div className="icon valid-attribute">
              <CheckIcon />
            </div>
          )}

          <Tooltip title={translate("workflow.duplicate")}>
            <div
              className="icon"
              onClick={() => onDuplicateAttribute(index, attribute)}
            >
              <CopyBoldIcon />
            </div>
          </Tooltip>

          {allowDelete && (
            <Tooltip title={translate("workflow.deleteAttr")}>
              <div
                className="icon delete"
                onClick={() => onRemoveAttribute(index)}
              >
                <TrashBoldIcon />
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="content">
        <div className="label">{translate("resource.variableName")}:</div>
        <Input
          className="custom-input"
          style={{ marginBottom: "var(--margin-bottom)" }}
          placeholder={namePlaceholder}
          onFocus={onClick}
          onChange={onChangeVariableName}
          value={attribute?.variable || ""}
        />

        <div className="label">{`${translate("workflow.value")}:`}</div>
        <Input
          className="custom-input"
          placeholder={labelPlaceholder}
          onFocus={onClick}
          onChange={onChangeValue}
          value={attribute?.value || ""}
        />
      </div>
    </ColumnWrapper>
  );
};

export default ColumnConfig;
