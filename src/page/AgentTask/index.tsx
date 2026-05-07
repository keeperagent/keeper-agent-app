import { useEffect, useState, useCallback, useMemo } from "react";
import { connect } from "react-redux";
import { Alert, Button, Select, Switch, Tooltip, message } from "antd";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { actSetPageName } from "@/redux/layout";
import { RootState } from "@/redux/store";
import {
  IAgentTask,
  IAgentProfile,
  IPreference,
  AgentTaskStatus,
  AgentTaskPriority,
  LLMProvider,
} from "@/electron/type";
import {
  useGetListAgentTask,
  useUpdateAgentTask,
  useDeleteAgentTask,
  usePauseAgentTask,
  useRerunAgentTask,
  useAgentTaskRealtime,
} from "@/hook/agentTask";

import { useGetListAgentProfile } from "@/hook/agentProfile";
import { useUpdatePreference } from "@/hook";
import { formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { SearchInput } from "@/component";
import RealtimeIndicator from "@/component/RealtimeIndicator";
import { ModalAgentTask } from "./ModalAgentTask";
import { TaskCardDragOverlay } from "./TaskCard";
import { Wrapper, OptionWrapper } from "./style";
import DroppableColumn from "./DroppableColumn";

interface ColumnDef {
  dropStatus: AgentTaskStatus;
  displayStatuses: AgentTaskStatus[];
  labelKey: string;
}

const COLUMNS: ColumnDef[] = [
  {
    dropStatus: AgentTaskStatus.INIT,
    displayStatuses: [AgentTaskStatus.INIT, AgentTaskStatus.PAUSED],
    labelKey: "agentTaskColumnInit",
  },
  {
    dropStatus: AgentTaskStatus.IN_PROGRESS,
    displayStatuses: [AgentTaskStatus.IN_PROGRESS],
    labelKey: "agentTaskColumnInProgress",
  },
  {
    dropStatus: AgentTaskStatus.DONE,
    displayStatuses: [AgentTaskStatus.DONE],
    labelKey: "agentTaskColumnDone",
  },
  {
    dropStatus: AgentTaskStatus.FAILED,
    displayStatuses: [AgentTaskStatus.FAILED],
    labelKey: "agentTaskColumnFailed",
  },
  {
    dropStatus: AgentTaskStatus.CANCELLED,
    displayStatuses: [AgentTaskStatus.CANCELLED, AgentTaskStatus.EXPIRED],
    labelKey: "agentTaskColumnCancelled",
  },
];

const PRIORITY_FILTER_OPTIONS = [
  { label: "Urgent", value: AgentTaskPriority.URGENT },
  { label: "High", value: AgentTaskPriority.HIGH },
  { label: "Medium", value: AgentTaskPriority.MEDIUM },
  { label: "Low", value: AgentTaskPriority.LOW },
];

const isLLMConfigured = (
  preference: IPreference | null,
  provider: LLMProvider | null,
): boolean => {
  if (!preference || !provider) {
    return false;
  }

  switch (provider) {
    case LLMProvider.CLAUDE:
      return (
        Boolean(preference.useClaudeCLI) ||
        (Boolean(preference.anthropicApiKey) &&
          Boolean(preference.anthropicModel))
      );
    case LLMProvider.OPENAI:
      return (
        Boolean(preference.useCodexCLI) ||
        (Boolean(preference.openAIApiKey) && Boolean(preference.openAIModel))
      );
    case LLMProvider.GEMINI:
      return (
        Boolean(preference.googleGeminiApiKey) &&
        Boolean(preference.googleGeminiModel)
      );
    case LLMProvider.OPENROUTER:
      return (
        Boolean(preference.openRouterApiKey) &&
        Boolean(preference.openRouterModel)
      );
    case LLMProvider.OLLAMA:
      return Boolean(preference.ollamaModel);
    default:
      return false;
  }
};

const AgentTaskPage = (props: any) => {
  const { listAgentTask, listAgentProfile, preference, actSetPageName } = props;
  const { translate } = useTranslation();

  const { getListAgentTask } = useGetListAgentTask();
  const { getListAgentProfile } = useGetListAgentProfile();
  const { updateAgentTask } = useUpdateAgentTask();
  const { deleteAgentTask, bulkDeleteAgentTask } = useDeleteAgentTask();
  const { pauseAgentTask } = usePauseAgentTask();
  const { rerunAgentTask } = useRerunAgentTask();
  const { updatePreference } = useUpdatePreference();

  const mainAgentProvider = useMemo((): LLMProvider | null => {
    const mainProfile = (listAgentProfile || []).find(
      (profile: IAgentProfile) => profile.isMainAgent,
    );
    return (mainProfile?.llmProvider as LLMProvider) || null;
  }, [listAgentProfile]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<IAgentTask | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragStatus, setActiveDragStatus] =
    useState<AgentTaskStatus | null>(null);
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
    getListAgentProfile({ page: 1, pageSize: 200 });
  }, []);

  useEffect(() => {
    setLastUpdatedAt(Date.now());
  }, [listAgentTask]);

  useEffect(() => {
    setLastUpdatedText(formatTime(lastUpdatedAt));
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
  const isAgentTaskPaused = Boolean(preference?.isStopAllAgentTask);

  const onToggleAgentTask = async (checked: boolean) => {
    await updatePreference({
      id: preference?.id,
      isStopAllAgentTask: !checked,
    });

    if (checked) {
      message.info(translate("agentTaskResumedMessage"));
    } else {
      message.warning(translate("agentTaskPausedMessage"));
    }
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

  const onRetryAgentTask = (id: number) => {
    updateAgentTask(id, { status: AgentTaskStatus.INIT });
  };

  const onResumeAgentTask = (id: number) => {
    updateAgentTask(id, { status: AgentTaskStatus.INIT });
  };

  const onPauseAgentTask = (task: IAgentTask) => {
    if (task.id) {
      pauseAgentTask(task.id);
    }
  };

  const onRerunAgentTask = (id: number) => {
    rerunAgentTask(id);
  };

  const onBulkDeleteAgentTasks = (ids: number[]) => {
    bulkDeleteAgentTask(ids);
  };

  const onBulkRetryAllFailed = () => {
    (listAgentTask || [])
      .filter((task: IAgentTask) => task.status === AgentTaskStatus.FAILED)
      .forEach((task: IAgentTask) => {
        if (task.id) {
          onRetryAgentTask(task.id);
        }
      });
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
    const draggedId = String(event.active.id);
    setActiveDragId(draggedId);
    const draggedTask = (listAgentTask || []).find(
      (task: IAgentTask) => String(task.id) === draggedId,
    );
    setActiveDragStatus(draggedTask?.status || null);
  };

  const isValidDropTarget = (dropStatus: AgentTaskStatus): boolean => {
    if (!activeDragStatus) {
      return true;
    }
    if (activeDragStatus === AgentTaskStatus.CANCELLED) {
      return dropStatus === AgentTaskStatus.INIT;
    }
    return true;
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setActiveDragStatus(null);
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

    if (
      draggedTask?.status === AgentTaskStatus.CANCELLED &&
      newStatus !== AgentTaskStatus.INIT
    ) {
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

  const agentOptions = (listAgentProfile || []).map((agent: any) => {
    const activeCount = (listAgentTask || []).filter(
      (task: IAgentTask) =>
        task.assignedAgentId === agent.id &&
        task.status === AgentTaskStatus.IN_PROGRESS,
    ).length;

    return {
      label: agent.name,
      value: agent.id,
      activeCount,
      description: agent.description || "",
      llmProvider: agent.llmProvider || "",
    };
  });

  return (
    <Wrapper>
      <div className="header">
        <div className="header-filters">
          <SearchInput
            placeholder={translate("agentTaskFilterSearchPlaceholder")}
            value={filterKeyword}
            onChange={setFilterKeyword}
            style={{ width: "30rem" }}
          />

          <Select
            className="filter-select custom-select"
            placeholder={translate("agentTaskFilterPriorityPlaceholder")}
            options={PRIORITY_FILTER_OPTIONS}
            value={filterPriority}
            onChange={(value) => setFilterPriority(value || null)}
            allowClear
            size="large"
          />

          <Select
            className="filter-select custom-select"
            placeholder={translate("agentTaskFilterAgentPlaceholder")}
            options={agentOptions}
            value={filterAgentId}
            onChange={(value) => setFilterAgentId(value || null)}
            allowClear
            size="large"
            optionRender={(option) => (
              <OptionWrapper>
                <div className="name">{option.data.label}</div>
                <div className="description">
                  {option.data.activeCount > 0
                    ? `${option.data.activeCount} active task${option.data.activeCount > 1 ? "s" : ""}`
                    : translate("agentTaskNoActiveTasksLabel")}
                </div>
              </OptionWrapper>
            )}
          />

          <Tooltip
            title={
              isAgentTaskPaused
                ? translate("agentTaskSwitchPaused")
                : translate("agentTaskSwitchActive")
            }
          >
            <Switch
              checkedChildren={translate("schedule.switchOn")}
              unCheckedChildren={translate("schedule.switchOff")}
              onChange={onToggleAgentTask}
              checked={!isAgentTaskPaused}
            />
          </Tooltip>
        </div>

        <div className="header-right">
          <RealtimeIndicator text={`Last updated: ${lastUpdatedText}`} />

          <Button type="primary" onClick={onOpenCreate}>
            {translate("agentTaskNewTaskButton")}
          </Button>
        </div>
      </div>

      {!isLLMConfigured(preference, mainAgentProvider) && (
        <Alert
          type="warning"
          title={translate("agentTaskLlmNotConfiguredWarning")}
          showIcon
        />
      )}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="board">
          {COLUMNS.map((column) => (
            <DroppableColumn
              key={column.dropStatus}
              dropStatus={column.dropStatus}
              displayStatuses={column.displayStatuses}
              label={translate(column.labelKey)}
              tasks={getTasksByStatuses(column.displayStatuses)}
              totalCount={getTotalByStatuses(column.displayStatuses)}
              isFiltered={hasActiveFilter}
              activeDragId={activeDragId}
              isInvalidTarget={
                Boolean(activeDragStatus) &&
                !isValidDropTarget(column.dropStatus)
              }
              onEdit={onOpenEdit}
              onDelete={deleteAgentTask}
              onPin={onPinAgentTask}
              onRetry={onRetryAgentTask}
              onRerun={onRerunAgentTask}
              onPause={onPauseAgentTask}
              onResume={onResumeAgentTask}
              onBulkDelete={onBulkDeleteAgentTasks}
              onBulkRetryAll={onBulkRetryAllFailed}
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
        onClose={onCloseModal}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentTask: state?.AgentTask?.listAgentTask,
    listAgentProfile: state?.AgentProfile?.listAgentProfile,
    preference: state?.Preference?.preference,
  }),
  { actSetPageName },
)(AgentTaskPage);
