import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Button, Form } from "antd";
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
import { EMPTY_STRING } from "@/config/constant";
import { ModalAgentTask } from "./ModalAgentTask";
import { TaskCard } from "./TaskCard";
import { PriorityBadge, Wrapper as TaskCardShell } from "./TaskCard/style";
import { Wrapper, KanbanColumn } from "./style";

const KANBAN_COLUMNS: { status: AgentTaskStatus; labelKey: string }[] = [
  { status: AgentTaskStatus.INIT, labelKey: "agentTask.column.init" },
  { status: AgentTaskStatus.ASSIGNED, labelKey: "agentTask.column.assigned" },
  { status: AgentTaskStatus.DONE, labelKey: "agentTask.column.done" },
  { status: AgentTaskStatus.FAILED, labelKey: "agentTask.column.failed" },
  { status: AgentTaskStatus.EXPIRED, labelKey: "agentTask.column.expired" },
];

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
          <TaskCard
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
    } catch {}
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

    if (draggedTask?.status === newStatus) {
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
            <TaskCardShell isDragging>
              <div className="task-title">{activeDragTask.title}</div>
              <PriorityBadge
                priority={activeDragTask.priority || AgentTaskPriority.MEDIUM}
              >
                {activeDragTask.priority || EMPTY_STRING}
              </PriorityBadge>
            </TaskCardShell>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ModalAgentTask
        open={modalOpen}
        editingTask={editingTask}
        form={form}
        agentOptions={agentOptions}
        confirmLoading={createLoading}
        onCancel={onCloseModal}
        onOk={onSubmit}
      />
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
