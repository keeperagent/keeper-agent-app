import type React from "react";
import type { CSSProperties } from "react";
import { Popconfirm, Tooltip } from "antd";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import {
  IAgentTask,
  AgentTaskPriority,
  AgentTaskCreatorType,
  AgentTaskStatus,
} from "@/electron/type";
import { AgentIcon, DeleteIcon, PinIcon, ReloadIcon } from "@/component/Icon";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { formatTime, formatDuration, trimText } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper } from "./style";

const getDueColor = (dueAt: number): string | undefined => {
  const now = Date.now();
  if (dueAt < now) {
    return "#f97316";
  }
  if (dueAt - now < 60 * 60 * 1000) {
    return "#f59e0b";
  }
  return undefined;
};

const getSourceBadge = (
  creatorType: AgentTaskCreatorType | undefined,
): { label: string; color: string } | null => {
  switch (creatorType) {
    case AgentTaskCreatorType.TELEGRAM:
      return { label: "TG", color: "#229ED9" };
    case AgentTaskCreatorType.WHATSAPP:
      return { label: "WA", color: "#25D366" };
    case AgentTaskCreatorType.MCP:
      return { label: "MCP", color: "#8b5cf6" };
    default:
      return null;
  }
};

const getTaskAge = (
  task: IAgentTask,
): { label: string; text: string; color?: string } | null => {
  const now = Date.now();
  const hour = 3_600_000;
  const day = 24 * hour;

  if (task.status === AgentTaskStatus.INIT && task.createAt) {
    const elapsed = now - task.createAt;
    const color =
      elapsed > day ? "#f97316" : elapsed > 6 * hour ? "#f59e0b" : undefined;
    return { label: "Waiting", text: formatDuration(elapsed), color };
  }

  if (task.status === AgentTaskStatus.IN_PROGRESS && task.startedAt) {
    const elapsed = now - task.startedAt;
    const color =
      elapsed > day ? "#f97316" : elapsed > hour ? "#f59e0b" : undefined;
    return { label: "Running", text: formatDuration(elapsed), color };
  }

  return null;
};

const getPriorityColor = (priority: AgentTaskPriority): string => {
  switch (priority) {
    case AgentTaskPriority.URGENT:
      return "#ef4444";
    case AgentTaskPriority.HIGH:
      return "#f97316";
    case AgentTaskPriority.MEDIUM:
      return "#f59e0b";
    case AgentTaskPriority.LOW:
      return "#60a5fa";
    default:
      return "#94a3b8";
  }
};

export interface TaskCardProps {
  task: IAgentTask;
  onEdit: (task: IAgentTask) => void;
  onDelete: (id: number) => void;
  onPin: (id: number, isPinned: boolean) => void;
  onRetry: (id: number) => void;
  isDragging?: boolean;
}

type TaskCardInnerProps = {
  task: IAgentTask;
  isDragging?: boolean;
  isFinished?: boolean;
  hideActions?: boolean;
  onEdit?: (task: IAgentTask) => void;
  onDelete?: (id: number) => void;
  onPin?: (id: number, isPinned: boolean) => void;
  onRetry?: (id: number) => void;
  wrapperRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  // Drag handle props from useDraggable; omit for drag overlay / static preview
  dragListeners?: ReturnType<typeof useDraggable>["listeners"];
  dragAttributes?: ReturnType<typeof useDraggable>["attributes"];
};

const TaskCardInner = ({
  task,
  isDragging,
  isFinished,
  hideActions,
  onEdit,
  onDelete,
  onPin,
  onRetry,
  wrapperRef,
  style,
  dragListeners,
  dragAttributes,
}: TaskCardInnerProps) => {
  const { translate } = useTranslation();
  const navigate = useNavigate();
  const priority = task.priority || AgentTaskPriority.MEDIUM;
  const priorityColor = getPriorityColor(priority);
  const priorityLabel = priority.charAt(0) + priority.slice(1).toLowerCase();
  const sourceBadge = getSourceBadge(task.creatorType);
  const taskAge = getTaskAge(task);
  const isRunning = task.status === AgentTaskStatus.IN_PROGRESS;
  const assignedAgentProvider = task.assignedAgent?.llmProvider
    ? LLM_PROVIDERS.find(
        (llmProvider) => llmProvider.key === task.assignedAgent?.llmProvider,
      )
    : null;

  const onClickAgentLink = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(
      `/dashboard/ask-agent?tab=AGENTS&agentProfileId=${task.assignedAgentId}`,
    );
  };

  return (
    <Wrapper
      ref={wrapperRef as React.Ref<HTMLDivElement>}
      style={style}
      isDragging={isDragging}
      isFinished={isFinished}
      className={isRunning ? "is-running" : undefined}
      {...dragAttributes}
      {...dragListeners}
      onClick={() => {
        onEdit && onEdit(task);
      }}
    >
      <div className="task-title">
        {trimText(task.title, 60) || EMPTY_STRING}
      </div>

      {task.description && (
        <div className="task-description">
          {trimText(task.description, 90) || EMPTY_STRING}
        </div>
      )}

      <div className="task-meta">
        <div className="task-meta-left">
          {task.assignedAgent && (
            <div
              className="task-meta-line task-agent-link"
              onClick={onClickAgentLink}
            >
              {assignedAgentProvider?.icon ? (
                <img
                  src={assignedAgentProvider.icon}
                  alt={assignedAgentProvider.label}
                  className="task-meta-line-icon"
                />
              ) : (
                <AgentIcon className="task-meta-line-icon" />
              )}
              <span className="task-agent">{task.assignedAgent.name}</span>
            </div>
          )}

          {task.dueAt &&
          (task.status === AgentTaskStatus.INIT ||
            task.status === AgentTaskStatus.IN_PROGRESS) ? (
            <div
              className="task-meta-line"
              style={{ color: getDueColor(task.dueAt) }}
            >
              <span className="task-due">Due · {formatTime(task.dueAt)}</span>
            </div>
          ) : null}

          {taskAge ? (
            <div className="task-age" style={{ color: taskAge.color }}>
              {taskAge.label} · {taskAge.text}
            </div>
          ) : task.startedAt && !task.dueAt ? (
            <div className="task-meta-line">
              <span className="task-due">{formatTime(task.startedAt)}</span>
            </div>
          ) : null}
        </div>

        <div className="task-meta-right">
          {sourceBadge && (
            <span
              className="task-source-badge"
              style={{
                color: sourceBadge.color,
                background: `${sourceBadge.color}1a`,
                border: `1px solid ${sourceBadge.color}40`,
              }}
            >
              {sourceBadge.label}
            </span>
          )}

          <span
            className="task-priority-pill"
            style={{
              color: priorityColor,
              background: `${priorityColor}1a`,
              border: `1px solid ${priorityColor}40`,
            }}
          >
            {priorityLabel}
          </span>
        </div>
      </div>

      {!hideActions && (onDelete || onPin || onRetry) && (
        <div className="task-actions">
          {onDelete && (
            <Popconfirm
              title={translate("confirmDelete")}
              onConfirm={(event) => {
                event?.stopPropagation();
                onDelete(task.id!);
              }}
              onCancel={(event) => {
                event?.stopPropagation();
              }}
              okText={translate("yes")}
              cancelText={translate("no")}
            >
              <span
                className="task-action-btn"
                onClick={(event) => event?.stopPropagation()}
              >
                <DeleteIcon color="var(--color-error)" />
              </span>
            </Popconfirm>
          )}

          {onRetry && task.status === AgentTaskStatus.FAILED && (
            <Tooltip title={translate("agentTask.retryTooltip")}>
              <span
                className="task-action-btn"
                onClick={(event) => {
                  event?.stopPropagation();
                  onRetry(task.id!);
                }}
              >
                <ReloadIcon color="currentColor" />
              </span>
            </Tooltip>
          )}

          {onPin && (
            <Tooltip
              title={translate(
                task.isPinned
                  ? "agentTask.unpinTooltip"
                  : "agentTask.pinTooltip",
              )}
            >
              <span
                className={`task-action-btn ${task.isPinned ? "task-pin--active" : ""}`}
                onClick={(event) => {
                  event?.stopPropagation();
                  onPin(task.id!, !task.isPinned);
                }}
              >
                <PinIcon
                  color={
                    task.isPinned ? "var(--color-primary)" : "currentColor"
                  }
                />
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </Wrapper>
  );
};

export const TaskCardDragOverlay = ({ task }: { task: IAgentTask }) => (
  <TaskCardInner task={task} hideActions isDragging={false} />
);

const FINISHED_STATUSES = [
  AgentTaskStatus.DONE,
  AgentTaskStatus.FAILED,
  AgentTaskStatus.EXPIRED,
];

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onPin,
  onRetry,
  isDragging,
}: TaskCardProps) => {
  const isFinished = FINISHED_STATUSES.includes(task.status!);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(task.id),
    disabled: isFinished,
  });

  // When dragging, keep the original card in place as a placeholder.
  // The DragOverlay handles the moving copy — applying transform here causes a double-card shadow.
  const dragStyle =
    !isDragging && transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;

  return (
    <TaskCardInner
      task={task}
      isDragging={isDragging}
      isFinished={isFinished}
      hideActions={false}
      onEdit={onEdit}
      onDelete={onDelete}
      onPin={onPin}
      onRetry={onRetry}
      wrapperRef={setNodeRef}
      style={dragStyle}
      dragListeners={isFinished ? undefined : listeners}
      dragAttributes={isFinished ? undefined : attributes}
    />
  );
};
