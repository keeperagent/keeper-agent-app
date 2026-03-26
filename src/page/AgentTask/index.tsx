import { useEffect, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { connect } from "react-redux";
import { Alert, Button, Input, Select } from "antd";
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
import { preferenceSelector } from "@/redux/preference";
import { RootState } from "@/redux/store";
import {
  IAgentTask,
  IPreference,
  AgentTaskStatus,
  AgentTaskPriority,
  LLMProvider,
} from "@/electron/type";
import {
  useGetListAgentTask,
  useUpdateAgentTask,
  useDeleteAgentTask,
  useAgentTaskRealtime,
} from "@/hook/agentTask";
import { useGetListAgentRegistry } from "@/hook/agentRegistry";
import { formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { ModalAgentTask } from "./ModalAgentTask";
import { TaskCard, TaskCardDragOverlay } from "./TaskCard";
import { Wrapper, KanbanColumn, OptionWrapper } from "./style";

interface KanbanColumnDef {
  dropStatus: AgentTaskStatus;
  displayStatuses: AgentTaskStatus[];
  labelKey: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    dropStatus: AgentTaskStatus.INIT,
    displayStatuses: [AgentTaskStatus.INIT],
    labelKey: "agentTask.column.init",
  },
  {
    dropStatus: AgentTaskStatus.IN_PROGRESS,
    displayStatuses: [AgentTaskStatus.IN_PROGRESS],
    labelKey: "agentTask.column.inProgress",
  },
  {
    dropStatus: AgentTaskStatus.DONE,
    displayStatuses: [AgentTaskStatus.DONE],
    labelKey: "agentTask.column.done",
  },
  {
    dropStatus: AgentTaskStatus.FAILED,
    displayStatuses: [AgentTaskStatus.FAILED],
    labelKey: "agentTask.column.failed",
  },
  {
    dropStatus: AgentTaskStatus.CANCELLED,
    displayStatuses: [AgentTaskStatus.CANCELLED, AgentTaskStatus.EXPIRED],
    labelKey: "agentTask.column.cancelled",
  },
];

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

const PRIORITY_FILTER_OPTIONS = [
  { label: "Urgent", value: AgentTaskPriority.URGENT },
  { label: "High", value: AgentTaskPriority.HIGH },
  { label: "Medium", value: AgentTaskPriority.MEDIUM },
  { label: "Low", value: AgentTaskPriority.LOW },
];

interface DroppableColumnProps {
  dropStatus: AgentTaskStatus;
  displayStatuses: AgentTaskStatus[];
  label: string;
  tasks: IAgentTask[];
  totalCount: number;
  isFiltered: boolean;
  activeDragId: string | null;
  onEdit: (task: IAgentTask) => void;
  onDelete: (id: number) => void;
  onPin: (id: number, isPinned: boolean) => void;
}

const DroppableColumn = ({
  dropStatus,
  label,
  tasks,
  totalCount,
  isFiltered,
  activeDragId,
  onEdit,
  onDelete,
  onPin,
}: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: dropStatus });
  const { translate } = useTranslation();

  return (
    <KanbanColumn
      isDragOver={isOver}
      style={{ "--status-color": getStatusColor(dropStatus) } as CSSProperties}
    >
      <div className="column-header">
        <div className="column-title-group">
          <span className="column-status-dot" />
          <span className="column-title">{label}</span>
        </div>

        <span className="column-count">
          {isFiltered ? `${tasks.length} / ${totalCount}` : tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="column-body">
        {tasks.length === 0 && (
          <div className="column-empty">
            {isFiltered
              ? translate("agentTask.column.emptyFiltered")
              : translate("agentTask.column.empty")}
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            isDragging={activeDragId === String(task.id)}
          />
        ))}
      </div>
    </KanbanColumn>
  );
};

const isLLMConfigured = (preference: IPreference | null): boolean => {
  if (!preference?.llmProvider) {
    return false;
  }
  switch (preference.llmProvider as LLMProvider) {
    case LLMProvider.CLAUDE:
      return Boolean(preference.anthropicApiKey);
    case LLMProvider.OPENAI:
      return Boolean(preference.openAIApiKey);
    case LLMProvider.GEMINI:
      return Boolean(preference.googleGeminiApiKey);
    default:
      return false;
  }
};

const AgentTaskPage = (props: any) => {
  const { listAgentTask, listAgentRegistry, preference, actSetPageName } =
    props;
  const { translate } = useTranslation();

  const { getListAgentTask } = useGetListAgentTask();
  const { getListAgentRegistry } = useGetListAgentRegistry();
  const { updateAgentTask } = useUpdateAgentTask();
  const { deleteAgentTask } = useDeleteAgentTask();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<IAgentTask | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());
  const [lastUpdatedText, setLastUpdatedText] = useState("just now");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterPriority, setFilterPriority] =
    useState<AgentTaskPriority | null>(null);
  const [filterAgentId, setFilterAgentId] = useState<number | null>(null);
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

  useEffect(() => {
    setLastUpdatedAt(Date.now());
  }, [listAgentTask]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdatedText(formatTime(lastUpdatedAt));
    }, 10_000);

    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  const onTasksChanged = useCallback(() => {
    getListAgentTask();
  }, []);

  useAgentTaskRealtime(onTasksChanged);

  const hasActiveFilter =
    Boolean(filterKeyword) || filterPriority !== null || filterAgentId !== null;

  const onClearFilters = () => {
    setFilterKeyword("");
    setFilterPriority(null);
    setFilterAgentId(null);
  };

  const applyFilters = (tasks: IAgentTask[]): IAgentTask[] => {
    return tasks.filter((task) => {
      if (filterKeyword) {
        const keyword = filterKeyword.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(keyword);
        const matchesDesc = task.description?.toLowerCase().includes(keyword);
        if (!matchesTitle && !matchesDesc) {
          return false;
        }
      }
      if (filterPriority !== null && task.priority !== filterPriority) {
        return false;
      }
      if (filterAgentId !== null && task.assignedAgentId !== filterAgentId) {
        return false;
      }
      return true;
    });
  };

  const getTasksByStatuses = (statuses: AgentTaskStatus[]): IAgentTask[] => {
    const all = (listAgentTask || []).filter((task: IAgentTask) =>
      statuses.includes(task.status!),
    );
    const filtered = applyFilters(all);

    return [...filtered].sort((taskA, taskB) => {
      if (taskA.isPinned && !taskB.isPinned) {
        return -1;
      }
      if (!taskA.isPinned && taskB.isPinned) {
        return 1;
      }
      return 0;
    });
  };

  const onPinAgentTask = (id: number, isPinned: boolean) => {
    updateAgentTask(id, { isPinned });
  };

  const getTotalByStatuses = (statuses: AgentTaskStatus[]): number =>
    (listAgentTask || []).filter((task: IAgentTask) =>
      statuses.includes(task.status!),
    ).length;

  const onOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const onOpenEdit = (task: IAgentTask) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setEditingTask(null), 300);
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

  const agentOptions = (listAgentRegistry || []).map((agent: any) => {
    const activeCount = (listAgentTask || []).filter(
      (task: IAgentTask) =>
        task.assignedAgentId === agent.id &&
        task.status === AgentTaskStatus.IN_PROGRESS,
    ).length;

    return {
      label: agent.name,
      value: agent.id,
      activeCount,
    };
  });

  return (
    <Wrapper>
      <div className="header">
        <div className="header-filters">
          <Input
            className="filter-search custom-input"
            placeholder={translate("agentTask.filter.placeholder.search")}
            value={filterKeyword}
            onChange={(event) => setFilterKeyword(event.target.value)}
            allowClear
            size="large"
          />

          <Select
            className="filter-select custom-select"
            placeholder={translate("agentTask.filter.placeholder.priority")}
            options={PRIORITY_FILTER_OPTIONS}
            value={filterPriority}
            onChange={(value) => setFilterPriority(value)}
            allowClear
            size="large"
          />

          <Select
            className="filter-select custom-select"
            placeholder={translate("agentTask.filter.placeholder.agent")}
            options={agentOptions}
            value={filterAgentId}
            onChange={(value) => setFilterAgentId(value)}
            allowClear
            size="large"
            optionRender={(option) => (
              <OptionWrapper>
                <div className="name">{option.data.label}</div>
                <div className="description">
                  {option.data.activeCount > 0
                    ? `${option.data.activeCount} active task${option.data.activeCount > 1 ? "s" : ""}`
                    : translate("agentTask.label.noActiveTasks")}
                </div>
              </OptionWrapper>
            )}
          />

          {hasActiveFilter && (
            <Button onClick={onClearFilters}>
              {translate("agentTask.filter.clearAll")}
            </Button>
          )}
        </div>

        <div className="header-right">
          <div className="realtime-indicator">
            <span className="realtime-dot" />
            <span className="realtime-text">
              Last updated: {lastUpdatedText}
            </span>
          </div>

          <Button type="primary" onClick={onOpenCreate}>
            {translate("agentTask.button.newTask")}
          </Button>
        </div>
      </div>

      {!isLLMConfigured(preference) && (
        <Alert
          type="warning"
          title={translate("agentTask.warning.llmNotConfigured")}
          showIcon
        />
      )}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="board">
          {KANBAN_COLUMNS.map((column) => (
            <DroppableColumn
              key={column.dropStatus}
              dropStatus={column.dropStatus}
              displayStatuses={column.displayStatuses}
              label={translate(column.labelKey)}
              tasks={getTasksByStatuses(column.displayStatuses)}
              totalCount={getTotalByStatuses(column.displayStatuses)}
              isFiltered={hasActiveFilter}
              activeDragId={activeDragId}
              onEdit={onOpenEdit}
              onDelete={deleteAgentTask}
              onPin={onPinAgentTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDragTask ? (
            <TaskCardDragOverlay task={activeDragTask} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ModalAgentTask
        open={modalOpen}
        editingTask={editingTask}
        agentOptions={agentOptions}
        onClose={onCloseModal}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentTask: agentTaskSelector(state).listAgentTask,
    listAgentRegistry: agentRegistrySelector(state).listAgentRegistry,
    preference: preferenceSelector(state).preference,
  }),
  { actSetPageName },
)(AgentTaskPage);
