import { ChangeEvent, useEffect, useMemo, useRef } from "react";
import { Input, Badge, Checkbox } from "antd";
import { COLORS } from "@/config/constant";
import { CheckIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { ColumnWrapper } from "./style";
import { IColumnConfig } from "../index";

type IColumnConfigProps = {
  index: number;
  activeCol: number | null;
  setActiveCol: (value: number | null) => void;
  setConfig: (value: IColumnConfig) => void;
  config: IColumnConfig;
  isModalOpen: boolean;
};

const ColumnConfig = (props: IColumnConfigProps) => {
  const { index, activeCol, setActiveCol, setConfig, config, isModalOpen } =
    props;
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { translate } = useTranslation();

  const variableFieldName = `col${index + 1}Variable`;
  const labelFieldName = `col${index + 1}Label`;
  const isEncryptFieldName = `col${index + 1}IsEncrypt`;

  const isValid = useMemo(() => {
    return config?.[variableFieldName] && config?.[labelFieldName];
  }, [config, variableFieldName, labelFieldName]);

  const isActive = useMemo(() => {
    return activeCol === index;
  }, [activeCol, index]);

  useEffect(() => {
    if (index === 0 && isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
  }, [index, isModalOpen]);

  useEffect(() => {
    if (elementRef && isActive) {
      elementRef?.current?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  }, [isActive]);

  const onClick = () => {
    if (activeCol !== index) {
      setActiveCol(index);
    }
  };

  const onChangeVariableName = (event: ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      [variableFieldName]: event?.target?.value?.toUpperCase(),
    });
  };

  const onChangeLabel = (event: ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [labelFieldName]: event.target.value });
  };

  const onChangeEncrypt = (event: any) => {
    setConfig({ ...config, [isEncryptFieldName]: event?.target?.checked });
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
    <ColumnWrapper ref={elementRef} className={isActive ? "active" : ""}>
      <div className="col-label">
        <Badge
          count={`${translate("column")} ${index + 1}`}
          size="small"
          color={COLORS[index % COLORS.length]}
        />
      </div>

      {isValid && (
        <div className="is-valid">
          <CheckIcon color="var(--color-success)" />
        </div>
      )}

      <div className="content">
        <div className="label">{translate("resource.variableName")}:</div>
        <Input
          className="custom-input"
          style={{ marginBottom: "var(--margin-bottom)" }}
          placeholder={namePlaceholder}
          onFocus={onClick}
          onChange={onChangeVariableName}
          value={config?.[variableFieldName] || ""}
          // @ts-ignore
          ref={inputRef}
          onInput={(e) =>
            ((e.target as HTMLInputElement).value = (
              e.target as HTMLInputElement
            )?.value
              .toUpperCase()
              ?.replaceAll(" ", ""))
          }
        />

        <div className="label">{translate("resource.variableLabel")}:</div>
        <Input
          className="custom-input"
          placeholder={labelPlaceholder}
          onFocus={onClick}
          onChange={onChangeLabel}
          value={config?.[labelFieldName] || ""}
        />

        <Checkbox
          onChange={onChangeEncrypt}
          style={{ marginTop: "1rem" }}
          checked={Boolean(config?.[isEncryptFieldName])}
        >
          {translate("encrypted")}?
        </Checkbox>
      </div>
    </ColumnWrapper>
  );
};

export default ColumnConfig;
