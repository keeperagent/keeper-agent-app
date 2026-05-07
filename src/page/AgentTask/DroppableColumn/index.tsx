import { Fragment, useState } from "react";
import type { CSSProperties } from "react";
import AnimatedNumbers from "react-animated-numbers";
import { Dropdown, Popconfirm } from "antd";
import type { MenuProps } from "antd";
import { useDroppable } from "@dnd-kit/core";
import { AgentTaskStatus, IAgentTask } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import { TaskCard } from "../TaskCard";
import { ColumnWrapper } from "./style";

const getStatusColor = (status: AgentTaskStatus): string => {
  switch (status) {
    case AgentTaskStatus.INIT:
      return "#94a3b8";
    case AgentTaskStatus.IN_PROGRESS:
      return "#3b82f6";
    case AgentTaskStatus.DONE:
      return "#22c55e";
    case AgentTaskStatus.FAILED:
      return "#ef4444";
    case AgentTaskStatus.CANCELLED:
      return "#94a3b8";
    default:
      return "#94a3b8";
  }
};

export interface DroppableColumnProps {
  dropStatus: AgentTaskStatus;
  displayStatuses: AgentTaskStatus[];
  label: string;
  tasks: IAgentTask[];
  totalCount: number;
  isFiltered: boolean;
  activeDragId: string | null;
  isInvalidTarget: boolean;
  onEdit: (task: IAgentTask) => void;
  onDelete: (id: number) => void;
  onPin: (id: number, isPinned: boolean) => void;
  onRetry: (id: number) => void;
  onRerun: (id: number) => void;
  onPause?: (task: IAgentTask) => void;
  onResume?: (id: number) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkRetryAll?: () => void;
}

const DroppableColumn = ({
  dropStatus,
  label,
  tasks,
  totalCount,
  isFiltered,
  activeDragId,
  isInvalidTarget,
  onEdit,
  onDelete,
  onPin,
  onRetry,
  onRerun,
  onPause,
  onResume,
  onBulkDelete,
  onBulkRetryAll,
}: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: dropStatus });
  const { translate } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"delete" | "retry" | null>(
    null,
  );

  const onBulkConfirm = () => {
    if (pendingAction === "delete" && onBulkDelete) {
      onBulkDelete(tasks.map((task) => task.id!));
    } else if (pendingAction === "retry" && onBulkRetryAll) {
      onBulkRetryAll();
    }
    setPendingAction(null);
  };

  const popconfirmTitle =
    pendingAction === "retry"
      ? translate("agentTask.retryAllFailed")
      : translate("agentTask.deleteAll");

  const popconfirmDescription =
    pendingAction === "retry"
      ? translate("agentTask.bulkRetryDescription")
      : translate("agentTask.bulkDeleteDescription");

  const buildColumnMenuItems = (): MenuProps["items"] => {
    const items: MenuProps["items"] = [];

    if (
      onBulkDelete &&
      tasks.length > 0 &&
      (dropStatus === AgentTaskStatus.DONE ||
        dropStatus === AgentTaskStatus.FAILED ||
        dropStatus === AgentTaskStatus.CANCELLED)
    ) {
      items.push({
        key: "delete-all",
        danger: true,
        label: translate("agentTask.deleteAll"),
        onClick: () => {
          setDropdownOpen(false);
          setPendingAction("delete");
        },
      });
    }

    if (
      onBulkRetryAll &&
      tasks.length > 0 &&
      dropStatus === AgentTaskStatus.FAILED
    ) {
      items.push({
        key: "retry-all",
        label: translate("agentTask.retryAllFailed"),
        onClick: () => {
          setDropdownOpen(false);
          setPendingAction("retry");
        },
      });
    }

    return items;
  };

  const columnMenuItems = buildColumnMenuItems();

  return (
    <ColumnWrapper
      isDragOver={isOver && !isInvalidTarget}
      isInvalidTarget={isInvalidTarget}
      style={{ "--status-color": getStatusColor(dropStatus) } as CSSProperties}
    >
      <div className="column-header">
        <div className="column-title-group">
          <span className="column-title">{label}</span>
        </div>

        <div className="column-header-right">
          <span className="column-count">
            <AnimatedNumbers animateToNumber={tasks.length} />
            {isFiltered && (
              <Fragment>
                {" / "}
                <AnimatedNumbers animateToNumber={totalCount} />
              </Fragment>
            )}
          </span>

          {columnMenuItems?.length ? (
            <Popconfirm
              open={pendingAction !== null}
              title={popconfirmTitle}
              description={popconfirmDescription}
              okText={translate("yes")}
              cancelText={translate("no")}
              okButtonProps={{ danger: pendingAction === "delete" }}
              onConfirm={onBulkConfirm}
              onCancel={() => setPendingAction(null)}
              placement="bottomRight"
            >
              <Dropdown
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
                menu={{ items: columnMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <span className="column-menu-btn">⋮</span>
              </Dropdown>
            </Popconfirm>
          ) : null}
        </div>
      </div>

      <div ref={setNodeRef} className="column-body">
        {tasks.length === 0 && (
          <div className="column-empty">
            {isFiltered
              ? translate("agentTaskColumnEmptyFiltered")
              : translate("agentTaskColumnEmpty")}
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            onRetry={onRetry}
            onRerun={onRerun}
            onPause={onPause}
            onResume={onResume}
            isDragging={activeDragId === String(task.id)}
          />
        ))}
      </div>
    </ColumnWrapper>
  );
};

export default DroppableColumn;
