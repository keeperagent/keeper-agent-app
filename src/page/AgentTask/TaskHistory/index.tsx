import type { CSSProperties } from "react";
import dayjs from "dayjs";
import {
  IAgentTask,
  AgentTaskStatus,
  AgentTaskCreatorType,
} from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import { Wrapper } from "./style";

const STATUS_COLORS: Record<string, string> = {
  [AgentTaskStatus.INIT]: "#94a3b8",
  [AgentTaskStatus.IN_PROGRESS]: "#3b82f6",
  [AgentTaskStatus.DONE]: "#22c55e",
  [AgentTaskStatus.FAILED]: "#ef4444",
  [AgentTaskStatus.EXPIRED]: "#f97316",
  [AgentTaskStatus.CANCELLED]: "#94a3b8",
};

interface ITaskHistoryEntry {
  status: AgentTaskStatus;
  label: string;
  actor: string;
  message?: string;
  time: number;
}

const getCreatorLabel = (creatorType?: AgentTaskCreatorType): string => {
  switch (creatorType) {
    case AgentTaskCreatorType.TELEGRAM:
      return "Telegram";
    case AgentTaskCreatorType.WHATSAPP:
      return "WhatsApp";
    case AgentTaskCreatorType.MCP:
      return "MCP";
    case AgentTaskCreatorType.AGENT:
      return "Agent";
    default:
      return "You";
  }
};

const buildTaskHistory = (task: IAgentTask): ITaskHistoryEntry[] => {
  const entries: ITaskHistoryEntry[] = [];

  entries.push({
    status: AgentTaskStatus.INIT,
    label: "Created",
    actor: getCreatorLabel(task.creatorType),
    time: task.createAt!,
  });

  if (task.startedAt) {
    entries.push({
      status: AgentTaskStatus.IN_PROGRESS,
      label: "Started",
      actor: task.assignedAgent?.name || "Agent",
      time: task.startedAt,
    });
  }

  if (task.status === AgentTaskStatus.DONE && task.completedAt) {
    entries.push({
      status: AgentTaskStatus.DONE,
      label: "Completed",
      actor: task.assignedAgent?.name || "Agent",
      time: task.completedAt,
    });
  } else if (task.status === AgentTaskStatus.FAILED) {
    entries.push({
      status: AgentTaskStatus.FAILED,
      label: "Failed",
      actor: task.assignedAgent?.name || "Agent",
      message: task.errorMessage,
      time: task.updateAt!,
    });
  } else if (task.status === AgentTaskStatus.EXPIRED) {
    entries.push({
      status: AgentTaskStatus.EXPIRED,
      label: "Expired",
      actor: "System",
      time: task.updateAt!,
    });
  } else if (task.status === AgentTaskStatus.CANCELLED) {
    entries.push({
      status: AgentTaskStatus.CANCELLED,
      label: "Cancelled",
      actor: "You",
      time: task.updateAt!,
    });
  }

  return entries;
};

interface TaskHistoryProps {
  task: IAgentTask;
}

export const TaskHistory = ({ task }: TaskHistoryProps) => {
  const { translate } = useTranslation();
  const historyEntries = buildTaskHistory(task);

  return (
    <Wrapper>
      <div className="history-title">
        {translate("agentTask.label.history")}
      </div>

      {historyEntries.map((entry, index) => (
        <div className="history-entry" key={index}>
          <div className="history-line-col">
            <span
              className="history-dot"
              style={
                { "--dot-color": STATUS_COLORS[entry.status] } as CSSProperties
              }
            />

            {index < historyEntries.length - 1 && (
              <span className="history-connector" />
            )}
          </div>

          <div className="history-body">
            <div className="history-row">
              <span className="history-label">{entry.label}</span>
              <span className="history-actor">{entry.actor}</span>
              <span className="history-time">
                {dayjs(entry.time).format("MMM D, HH:mm")}
              </span>
            </div>

            {entry.message && (
              <div className="history-message">{entry.message}</div>
            )}
          </div>
        </div>
      ))}
    </Wrapper>
  );
};
