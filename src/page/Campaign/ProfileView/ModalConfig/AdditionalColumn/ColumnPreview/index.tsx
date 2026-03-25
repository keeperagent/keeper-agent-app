import { useMemo } from "react";
import { COLORS } from "@/config/constant";
import { useTranslation } from "@/hook";
import { ColumnPreviewWrapper } from "./style";
import { IColumnConfig } from "../index";

type IColumnPreviewProps = {
  index: number;
  activeCol: number | null;
  setActiveCol: (value: number | null) => void;
  config: IColumnConfig;
};

const ColumnPreview = (props: IColumnPreviewProps) => {
  const { index, activeCol, setActiveCol, config } = props;
  const { translate } = useTranslation();

  const variableFieldName = `col${index + 1}Variable`;
  const labelFieldName = `col${index + 1}Label`;

  const isValid = useMemo(() => {
    return config?.[variableFieldName] && config?.[labelFieldName];
  }, [config, variableFieldName, labelFieldName]);

  const color = useMemo(() => {
    return COLORS[index % COLORS.length];
  }, [index]);

  const isActive = useMemo(() => {
    return activeCol === index;
  }, [index, activeCol]);

  const onClick = () => {
    setActiveCol(activeCol !== index ? index : null);
  };

  return (
    <ColumnPreviewWrapper
      className={isActive ? "active" : ""}
      onClick={onClick}
    >
      {
        <div
          className="valid"
          style={{
            backgroundColor: isValid
              ? "var(--color-primary-light)"
              : "transparent",
          }}
        ></div>
      }

      <div
        className="label"
        style={{ background: color, opacity: isValid ? 1 : 0.5 }}
      >
        {index + 1}
      </div>

      <div className="grid">
        <div className="horizon-line" />
        <div className="horizon-line" />
        <div className="horizon-line" />
        <div className="horizon-line" />
        <div className="horizon-line" />
      </div>

      {
        <div
          className="invalid"
          style={{
            backgroundColor: !isValid ? "var(--color-error)" : "transparent",
          }}
        ></div>
      }
    </ColumnPreviewWrapper>
  );
};

export default ColumnPreview;
