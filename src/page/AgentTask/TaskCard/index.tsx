import { Button, Popconfirm } from "antd";
import { useDraggable } from "@dnd-kit/core";
import { IAgentTask, AgentTaskPriority } from "@/electron/type";
import { DeleteIcon, EditIcon } from "@/component/Icon";
import { formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
import { PriorityBadge, Wrapper } from "./style";

export interface TaskCardProps {
  task: IAgentTask;
  onEdit: (task: IAgentTask) => void;
  onDelete: (id: number) => void;
  isDragging?: boolean;
}

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  isDragging,
}: TaskCardProps) => {
  const { translate } = useTranslation();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(task.id),
  });

  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <Wrapper
      ref={setNodeRef}
      style={dragStyle}
      isDragging={isDragging}
      {...listeners}
      {...attributes}
    >
      <div className="task-title">{task.title}</div>

      {task.description && (
        <div className="task-description">{task.description}</div>
      )}

      <div className="task-meta">
        <div className="task-meta-primary">
          <PriorityBadge priority={task.priority || AgentTaskPriority.MEDIUM}>
            {task.priority || EMPTY_STRING}
          </PriorityBadge>

          {task.assignedAgent && (
            <span className="task-agent">{task.assignedAgent.name}</span>
          )}

          {task.dueAt && (
            <span className="task-due">{formatTime(task.dueAt)}</span>
          )}
        </div>

        <div className="task-actions">
          <Button
            type="text"
            size="small"
            icon={<EditIcon />}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(task);
            }}
          />

          <Popconfirm
            title={translate("confirmDelete")}
            onConfirm={() => onDelete(task.id!)}
            okText={translate("yes")}
            cancelText={translate("no")}
          >
            <span className="task-delete">
              <DeleteIcon />
            </span>
          </Popconfirm>
        </div>
      </div>
    </Wrapper>
  );
};
