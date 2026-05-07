import { useEffect, useRef, useState } from "react";
import { Collapse, Empty, Spin } from "antd";
import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import { useGetAgentTaskLog, useGetLiveToolCalls } from "@/hook/agentTask";
import { parseToolCallSequence } from "@/hook/agent";
import ToolCallGroup from "@/component/AgentChatView/ToolCallCard";
import type { ToolCallState } from "@/component/AgentChatView/util";
import { ToolCallStateStatus } from "@/component/AgentChatView/util";
import { formatTimeToDate } from "@/service/util";
import { Wrapper } from "./style";

const POLL_INTERVAL_MS = 500;

interface TaskExecutionLogProps {
  task: IAgentTask;
}

export const TaskExecutionLog = ({ task }: TaskExecutionLogProps) => {
  const { translate } = useTranslation();
  const isLive = task.status === AgentTaskStatus.IN_PROGRESS;

  const { logs, loading, getAgentTaskLog } = useGetAgentTaskLog();
  const [liveToolCalls, setLiveToolCalls] = useState<ToolCallState[]>([]);

  const { getLiveToolCalls } = useGetLiveToolCalls((data) => {
    const toolCalls: ToolCallState[] = data.map((entry: any) => ({
      runId: entry.runId,
      toolName: entry.toolName,
      input: entry.input || {},
      result: entry.result,
      state:
        entry.state === "running"
          ? ToolCallStateStatus.RUNNING
          : entry.state === "error"
            ? ToolCallStateStatus.ERROR
            : ToolCallStateStatus.DONE,
    }));
    setLiveToolCalls(toolCalls);
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiveToolCalls([]);
  }, [task.id]);

  useEffect(() => {
    if (!isLive || !task.id) {
      return;
    }

    getLiveToolCalls(task.id);
    intervalRef.current = setInterval(() => {
      getLiveToolCalls(task.id!);
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [task.id, isLive]);

  useEffect(() => {
    if (!isLive && task.id) {
      getAgentTaskLog(task.id);
    }
  }, [task.id, isLive]);

  useEffect(() => {
    if (isLive && liveToolCalls.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveToolCalls]);

  const logsWithTools = logs.filter((log) => Boolean(log.toolCallSequence));

  if (
    !isLive &&
    !loading &&
    logsWithTools.length === 0 &&
    liveToolCalls.length === 0
  ) {
    return null;
  }

  const renderContent = () => {
    if (!isLive && logsWithTools.length === 0 && liveToolCalls.length > 0) {
      return (
        <ToolCallGroup
          toolCalls={liveToolCalls}
          isActive={false}
          alwaysExpanded={true}
          staticTodos={true}
        />
      );
    }

    if (isLive) {
      if (liveToolCalls.length === 0) {
        return (
          <Empty
            description={translate("agentTask.executionLogWaiting")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "1.6rem 0" }}
          />
        );
      }
      return (
        <ToolCallGroup
          toolCalls={liveToolCalls}
          isActive={true}
          alwaysExpanded={true}
          staticTodos={false}
        />
      );
    }

    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "1.6rem 0",
          }}
        >
          <Spin />
        </div>
      );
    }

    if (logsWithTools.length === 1) {
      return (
        <ToolCallGroup
          toolCalls={parseToolCallSequence(logsWithTools[0].toolCallSequence)}
          isActive={false}
          alwaysExpanded={true}
          staticTodos={true}
        />
      );
    }

    const runItems = logsWithTools.map((log, index) => ({
      key: String(log.id),
      label: `Run ${index + 1} · ${formatTimeToDate(Number(log.createAt))}`,
      children: (
        <ToolCallGroup
          toolCalls={parseToolCallSequence(log.toolCallSequence)}
          isActive={false}
          alwaysExpanded={true}
          staticTodos={true}
        />
      ),
    }));

    return (
      <Collapse
        size="small"
        defaultActiveKey={[String(logsWithTools[logsWithTools.length - 1].id)]}
        items={runItems}
      />
    );
  };

  const defaultOpen = isLive && !task.result;

  const collapseItems = [
    {
      key: "execution-log",
      label: (
        <div className="exec-header">
          <span className="exec-label">
            {translate("agentTask.executionLogLabel")}
          </span>
        </div>
      ),
      children: (
        <div className="exec-body">
          {renderContent()}
          <div ref={bottomRef} />
        </div>
      ),
    },
  ];

  return (
    <Wrapper>
      <Collapse
        defaultActiveKey={defaultOpen ? ["execution-log"] : []}
        size="small"
        expandIconPlacement="end"
        items={collapseItems}
      />
    </Wrapper>
  );
};
