import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COLORS } from "@/config/constant";
import { ColumnPreviewWrapper } from "./style";
import { IColumnConfig } from "../index";

type IColumnPreviewProps = {
  id: string;
  dataIndex: string;
  activeCol: string | null;
  setActiveCol: (value: string | null) => void;
  config: IColumnConfig;
};

const ColumnPreview = (props: IColumnPreviewProps) => {
  const { id, dataIndex, activeCol, setActiveCol, config } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const colNumber = parseInt(dataIndex.replace("col", ""), 10);
  const variableFieldName = `${dataIndex}Variable`;
  const labelFieldName = `${dataIndex}Label`;

  const isValid = useMemo(() => {
    return config?.[variableFieldName] && config?.[labelFieldName];
  }, [config, variableFieldName, labelFieldName]);

  const color = useMemo(() => {
    return COLORS[(colNumber - 1) % COLORS.length];
  }, [colNumber]);

  const isActive = useMemo(() => {
    return activeCol === dataIndex;
  }, [dataIndex, activeCol]);

  const onClick = () => {
    setActiveCol(activeCol !== dataIndex ? dataIndex : null);
  };

  return (
    <ColumnPreviewWrapper
      ref={setNodeRef}
      style={style}
      className={isActive ? "active" : ""}
      onClick={onClick}
      {...attributes}
    >
      <div
        className="valid"
        style={{
          backgroundColor: isValid ? "var(--color-success)" : "transparent",
        }}
      ></div>

      <div
        className="label"
        style={{ background: color, opacity: isValid || isActive ? 1 : 0.5 }}
        {...listeners}
      >
        {colNumber}
      </div>

      <div className="grid" {...listeners}>
        <div className="horizon-line" />
        <div className="horizon-line" />
        <div className="horizon-line" />
        <div className="horizon-line" />
        <div className="horizon-line" />
      </div>

      <div
        className="invalid"
        style={{
          backgroundColor: !isValid ? "var(--color-error)" : "transparent",
        }}
      ></div>
    </ColumnPreviewWrapper>
  );
};

export default ColumnPreview;
