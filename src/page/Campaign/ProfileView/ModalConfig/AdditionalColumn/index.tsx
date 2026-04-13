import { useState } from "react";
import { Alert, Tooltip } from "antd";
import { connect } from "react-redux";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RootState } from "@/redux/store";
import { Code } from "@/component";
import { ReloadIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { actSetShouldShowResourceHelpAlert } from "@/redux/preference";
import ColumnConfig from "./ColumnConfig";
import ColumnPreview from "./ColumnPreview";
import { NUMBER_OF_COLUMN } from "@/electron/constant";
import { HelpWrapper, FormWrapper, PreviewHeader } from "./style";

const defaultColumnOrder = Array.from(
  { length: NUMBER_OF_COLUMN },
  (_, index) => `col${index + 1}`,
);

type IConfigFormProps = {
  setConfig: (value: IColumnConfig) => void;
  config: IColumnConfig;
  columnOrder: string[];
  setColumnOrder: (value: string[]) => void;
  isModalOpen: boolean;
  showResourceHelpAlert: boolean;
  actSetShouldShowResourceHelpAlert: (payload: boolean) => void;
};

export type IColumnConfig = {
  [key: string]: string | null;
};

const ConfigForm = (props: IConfigFormProps) => {
  const {
    setConfig,
    config,
    columnOrder,
    setColumnOrder,
    isModalOpen,
    showResourceHelpAlert,
  } = props;
  const [activeCol, setActiveCol] = useState<string | null>(null);
  const [draggingColKey, setDraggingColKey] = useState<string | null>(null);
  const { translate } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onCloseAlert = () => {
    props?.actSetShouldShowResourceHelpAlert(false);
  };

  const onDragStart = (event: DragStartEvent) => {
    setDraggingColKey(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingColKey(null);
    if (!over || active.id === over.id) {
      return;
    }
    const fromIndex = columnOrder.indexOf(String(active.id));
    const toIndex = columnOrder.indexOf(String(over.id));
    setColumnOrder(arrayMove(columnOrder, fromIndex, toIndex));
    setActiveCol(null);
  };

  return (
    <FormWrapper>
      {showResourceHelpAlert && (
        <Alert
          title={
            <HelpWrapper>
              {translate("resource.youCanPress")}
              <Code text="Tab" />
              {translate("resource.toMoveBetweenColumn")}
            </HelpWrapper>
          }
          type="warning"
          showIcon
          className="help"
          closable
          onClose={onCloseAlert}
        />
      )}

      <div className="list-column">
        {Array.from(Array(NUMBER_OF_COLUMN).keys()).map((_, index: number) => (
          <ColumnConfig
            index={index}
            key={index}
            setActiveCol={setActiveCol}
            activeCol={activeCol}
            setConfig={setConfig}
            config={config}
            isModalOpen={isModalOpen}
          />
        ))}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={columnOrder}
          strategy={horizontalListSortingStrategy}
        >
          <div className="preview">
            {columnOrder.map((colKey) => (
              <ColumnPreview
                id={colKey}
                key={colKey}
                dataIndex={colKey}
                setActiveCol={setActiveCol}
                activeCol={activeCol}
                config={config}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggingColKey && (
            <ColumnPreview
              id={draggingColKey}
              dataIndex={draggingColKey}
              setActiveCol={setActiveCol}
              activeCol={activeCol}
              config={config}
            />
          )}
        </DragOverlay>
      </DndContext>

      <PreviewHeader>
        <span className="hint">{translate("campaign.columnOrderHint")}</span>
        {columnOrder.length > 0 && (
          <Tooltip title={translate("campaign.resetColumnOrder")}>
            <span
              className="reset-btn"
              onClick={() => setColumnOrder(defaultColumnOrder)}
            >
              <ReloadIcon width={13} height={13} />
            </span>
          </Tooltip>
        )}
      </PreviewHeader>
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    showResourceHelpAlert: state?.Preference?.showResourceHelpAlert,
  }),
  {
    actSetShouldShowResourceHelpAlert,
  },
)(ConfigForm);
