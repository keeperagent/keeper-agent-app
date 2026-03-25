import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Button, Modal, Form, Input, Select, Popconfirm } from "antd";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { actSetPageName } from "@/redux/layout";
import { agentTaskSelector } from "@/redux/agentTask";
import { agentRegistrySelector } from "@/redux/agentRegistry";
import { RootState } from "@/redux/store";
import {
  IAgentTask,
  AgentTaskStatus,
  AgentTaskPriority,
} from "@/electron/type";
import {
  useGetListAgentTask,
  useCreateAgentTask,
  useUpdateAgentTask,
  useDeleteAgentTask,
} from "@/hook/agentTask";
import { useGetListAgentRegistry } from "@/hook/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { TrashIcon, EditIcon } from "@/component/Icon";
import { Wrapper, KanbanColumn, TaskCard, PriorityBadge } from "./style";

const KANBAN_COLUMNS: { status: AgentTaskStatus; labelKey: string }[] = [
  { status: AgentTaskStatus.INIT, labelKey: "agentTask.column.init" },
  { status: AgentTaskStatus.ASSIGNED, labelKey: "agentTask.column.assigned" },
  { status: AgentTaskStatus.DONE, labelKey: "agentTask.column.done" },
  { status: AgentTaskStatus.FAILED, labelKey: "agentTask.column.failed" },
  { status: AgentTaskStatus.EXPIRED, labelKey: "agentTask.column.expired" },
];

const formatDueDate = (dueAt?: number): string => {
  if (!dueAt) {
    return "";
  }
  return new Date(dueAt).toLocaleDateString();
};

interface TaskCardItemProps {
  task: IAgentTask;
  onEdit: (task: IAgentTask) => void;
  onDelete: (id: number) => void;
  isDragging?: boolean;
}

const DraggableCard = ({
  task,
  onEdit,
  onDelete,
  isDragging,
}: TaskCardItemProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(task.id),
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <TaskCard
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      {...listeners}
      {...attributes}
    >
      <div className="task-title">{task.title}</div>

      {task.description && (
        <div className="task-description">{task.description}</div>
      )}

      <div className="task-meta">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <PriorityBadge priority={task.priority || AgentTaskPriority.MEDIUM}>
            {task.priority || "MEDIUM"}
          </PriorityBadge>

          {task.assignedAgent && (
            <span className="task-agent">{task.assignedAgent.name}</span>
          )}

          {task.dueAt && (
            <span className="task-due">{formatDueDate(task.dueAt)}</span>
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
            title="Delete task?"
            onConfirm={() => onDelete(task.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<TrashIcon />}
              onClick={(event) => event.stopPropagation()}
            />
          </Popconfirm>
        </div>
      </div>
    </TaskCard>
  );
};

interface DroppableColumnProps {
  status: AgentTaskStatus;
  label: string;
  tasks: IAgentTask[];
  activeDragId: string | null;
  onEdit: (task: IAgentTask) => void;
  onDelete: (id: number) => void;
}

const DroppableColumn = ({
  status,
  label,
  tasks,
  activeDragId,
  onEdit,
  onDelete,
}: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <KanbanColumn isDragOver={isOver}>
      <div className="column-header">
        <span className="column-title">{label}</span>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div ref={setNodeRef} className="column-body">
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            isDragging={activeDragId === String(task.id)}
          />
        ))}
      </div>
    </KanbanColumn>
  );
};

const PRIORITY_OPTIONS = [
  { label: "Low", value: AgentTaskPriority.LOW },
  { label: "Medium", value: AgentTaskPriority.MEDIUM },
  { label: "High", value: AgentTaskPriority.HIGH },
  { label: "Urgent", value: AgentTaskPriority.URGENT },
];

const AgentTaskPage = (props: any) => {
  const { listAgentTask, listAgentRegistry, actSetPageName } = props;
  const { translate } = useTranslation();

  const { getListAgentTask } = useGetListAgentTask();
  const { getListAgentRegistry } = useGetListAgentRegistry();
  const { createAgentTask, loading: createLoading } = useCreateAgentTask();
  const { updateAgentTask } = useUpdateAgentTask();
  const { deleteAgentTask } = useDeleteAgentTask();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<IAgentTask | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useEffect(() => {
    actSetPageName(translate("sidebar.agentTask"));
  }, [translate]);

  useEffect(() => {
    getListAgentTask();
    getListAgentRegistry({ page: 1, pageSize: 200 });
  }, []);

  const getTasksByStatus = (status: AgentTaskStatus): IAgentTask[] =>
    (listAgentTask || []).filter((task: IAgentTask) => task.status === status);

  const onOpenCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ priority: AgentTaskPriority.MEDIUM });
    setModalOpen(true);
  };

  const onOpenEdit = (task: IAgentTask) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description || "",
      priority: task.priority || AgentTaskPriority.MEDIUM,
      assignedAgentId: task.assignedAgentId || undefined,
    });
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setEditingTask(null);
      form.resetFields();
    }, 300);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTask) {
        updateAgentTask(editingTask.id!, values);
      } else {
        createAgentTask(values);
      }
      onCloseModal();
    } catch {
      // validation failed
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const draggedTaskId = Number(active.id);
    const newStatus = over.id as AgentTaskStatus;

    const draggedTask = (listAgentTask || []).find(
      (task: IAgentTask) => task.id === draggedTaskId,
    );

    if (!draggedTask || draggedTask.status === newStatus) {
      return;
    }

    updateAgentTask(draggedTaskId, { status: newStatus });
  };

  const activeDragTask =
    activeDragId != null
      ? (listAgentTask || []).find(
          (task: IAgentTask) => String(task.id) === activeDragId,
        )
      : null;

  const agentOptions = (listAgentRegistry || []).map((agent: any) => ({
    label: agent.name,
    value: agent.id,
  }));

  return (
    <Wrapper>
      <div className="header">
        <span className="header-title">{translate("sidebar.agentTask")}</span>
        <Button type="primary" onClick={onOpenCreate}>
          {translate("agentTask.button.newTask")}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="board">
          {KANBAN_COLUMNS.map((column) => (
            <DroppableColumn
              key={column.status}
              status={column.status}
              label={translate(column.labelKey)}
              tasks={getTasksByStatus(column.status)}
              activeDragId={activeDragId}
              onEdit={onOpenEdit}
              onDelete={deleteAgentTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDragTask ? (
            <TaskCard isDragging>
              <div className="task-title">{activeDragTask.title}</div>
              <PriorityBadge
                priority={activeDragTask.priority || AgentTaskPriority.MEDIUM}
              >
                {activeDragTask.priority || "MEDIUM"}
              </PriorityBadge>
            </TaskCard>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal
        title={
          editingTask
            ? translate("agentTask.modal.editTitle")
            : translate("agentTask.modal.createTitle")
        }
        open={modalOpen}
        onCancel={onCloseModal}
        onOk={onSubmit}
        confirmLoading={createLoading}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={translate("agentTask.label.title")}
            rules={[{ required: true }]}
          >
            <Input
              placeholder={translate("agentTask.placeholder.title")}
              className="custom-input"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={translate("agentTask.label.description")}
          >
            <Input.TextArea
              placeholder={translate("agentTask.placeholder.description")}
              rows={3}
              className="custom-input"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label={translate("agentTask.label.priority")}
          >
            <Select
              options={PRIORITY_OPTIONS}
              className="custom-select"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="assignedAgentId"
            label={translate("agentTask.label.assignedAgent")}
          >
            <Select
              options={agentOptions}
              allowClear
              placeholder={translate("agentTask.placeholder.assignedAgent")}
              className="custom-select"
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentTask: agentTaskSelector(state).listAgentTask,
    listAgentRegistry: agentRegistrySelector(state).listAgentRegistry,
  }),
  { actSetPageName },
)(AgentTaskPage);
