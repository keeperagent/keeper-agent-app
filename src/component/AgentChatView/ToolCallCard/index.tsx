import { Fragment, useEffect, useState } from "react";
import { Tooltip } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MESSAGE, TOOL_KEYS } from "@/electron/constant";
import CodeEditor from "@/component/CodeEditor";
import ChartResult from "@/component/AgentChatView/ChartResult";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  DownArrowIcon,
} from "@/component/Icon";
import { type ToolCallState, ToolCallStateStatus } from "../util";
import {
  getToolIcon,
  getToolLabel,
  getSummaryPairs,
  parseResultItems,
  extractDomain,
  getFaviconUrl,
  getGroupSummary,
  getCodeContent,
  looksLikeMarkdown,
  parseTodos,
  normalizeUrl,
  SEARCH_TOOL_NAMES,
  HIDDEN_TOOL_NAMES,
} from "./util";
import { ToolCallGroupWrapper } from "./style";

const tryParseChart = (result?: string) => {
  if (!result) {
    return null;
  }
  try {
    const parsed = JSON.parse(result);
    if (parsed?.__type === "chart" && parsed.option) {
      return parsed as { option: Record<string, unknown>; height?: number };
    }
  } catch {}
  return null;
};

const openExternalUrl = (url: string): void => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, { url });
    }
  } catch {}
};

type ToolCallRowProps = {
  toolCall: ToolCallState;
  extractStateMap?: Map<string, ToolCallStateStatus>;
};

const ToolCallRow = ({ toolCall, extractStateMap }: ToolCallRowProps) => {
  const summaryPairs = getSummaryPairs(toolCall.toolName, toolCall.input);
  const resultItems = parseResultItems(
    toolCall.toolName,
    toolCall.result,
    toolCall.input,
  );
  const isSearchTool = SEARCH_TOOL_NAMES.has(toolCall.toolName as any);
  const isTaskTool = toolCall.toolName === TOOL_KEYS.TASK;
  const codeContent = getCodeContent(
    toolCall.toolName,
    toolCall.input,
    toolCall.result,
  );
  const chartData =
    toolCall.toolName === TOOL_KEYS.RENDER_CHART &&
    toolCall.state === ToolCallStateStatus.DONE
      ? tryParseChart(toolCall.result)
      : null;
  const todos =
    toolCall.toolName === TOOL_KEYS.WRITE_TODOS
      ? parseTodos(toolCall.input)
      : null;
  const completedCount = todos
    ? todos.filter((todo) => todo.status === "completed").length
    : 0;
  const totalCount = todos ? todos.length : 0;

  const toolIcon = (() => {
    if (toolCall.toolName === TOOL_KEYS.CONFIRM_APPROVAL && toolCall.result) {
      try {
        const parsed = JSON.parse(toolCall.result);
        if (parsed?.status === "rejected") return "✗";
      } catch {}
    }
    return getToolIcon(toolCall.toolName);
  })();

  // For search tools use the first summary value (query/url) as the primary visible label
  // For task tools show the subagent name formatted as a label
  const primaryLabel =
    isSearchTool && summaryPairs.length > 0
      ? summaryPairs[0].value
      : isTaskTool && summaryPairs.length > 0
        ? getToolLabel(summaryPairs[0].value)
        : getToolLabel(toolCall.toolName);

  // For task tools show only the description as secondary (skip subagent_type which is already in primaryLabel)
  const secondarySummary = isSearchTool
    ? ""
    : isTaskTool
      ? summaryPairs
          .slice(1)
          .map((pair) => pair.value)
          .join(" · ")
      : summaryPairs.map((pair) => pair.value).join(" · ");

  return (
    <div className="tool-row">
      <span
        className={`tool-icon${toolIcon === "✗" ? " tool-icon--error" : ""}`}
      >
        {toolIcon}
      </span>

      <div className="tool-row-header">
        <div className="tool-row-top">
          <span
            className={`tool-name${toolCall.state === ToolCallStateStatus.RUNNING ? " tool-name--running" : ""}`}
          >
            {isTaskTool
              ? (() => {
                  const suffix = [" subagent", " agent"].find((s) =>
                    primaryLabel.toLowerCase().endsWith(s),
                  );
                  return suffix ? (
                    <Fragment>
                      {primaryLabel.slice(0, -suffix.length)}
                      <span className="tool-name-dim">{suffix}</span>
                    </Fragment>
                  ) : (
                    primaryLabel
                  );
                })()
              : primaryLabel}
          </span>

          <div className="tool-status">
            {toolCall.state === ToolCallStateStatus.RUNNING && (
              <span className="pulse-dot" />
            )}

            {toolCall.state === ToolCallStateStatus.DONE &&
              resultItems.length > 0 && (
                <span className="result-count">
                  {resultItems.length} results
                </span>
              )}

            {todos && todos.length > 0 && (
              <span className="todo-counter">
                {completedCount}/{totalCount} done
              </span>
            )}

            {toolCall.state === ToolCallStateStatus.ERROR && (
              <Tooltip
                title={
                  <div style={{ maxHeight: "25rem", overflowY: "auto" }}>
                    {toolCall.result || "Unknown error"}
                  </div>
                }
                placement="top"
              >
                <span className="error-mark">✗</span>
              </Tooltip>
            )}
          </div>
        </div>

        {secondarySummary &&
          (looksLikeMarkdown(secondarySummary) ? (
            <div className="input-summary input-summary-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {secondarySummary}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="input-summary">{secondarySummary}</span>
          ))}
      </div>

      {codeContent && (
        <CodeEditor
          value={codeContent}
          language="javascript"
          readOnly
          height="auto"
          fontSize={12}
          className="code-block"
        />
      )}

      {resultItems.length > 0 && (
        <div className="result-items">
          {resultItems.map((resultItem, index) => {
            const extractState = extractStateMap?.get(
              normalizeUrl(resultItem.url),
            );
            return (
              <div
                key={index}
                className="result-item"
                onClick={() => openExternalUrl(resultItem.url)}
              >
                <img
                  className="result-favicon"
                  src={getFaviconUrl(resultItem.url)}
                  alt=""
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="result-title">{resultItem.title}</span>

                {extractState === ToolCallStateStatus.RUNNING && (
                  <span className="extract-spinner" />
                )}
                {extractState === ToolCallStateStatus.DONE && (
                  <span className="extract-done" />
                )}

                <span className="result-domain">
                  {extractDomain(resultItem.url)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {chartData && (
        <ChartResult option={chartData.option} height={chartData.height} />
      )}

      {todos && todos.length > 0 && (
        <div
          className={`todo-list${todos.every((todo) => todo.status === "completed") ? " todo-list--all-complete" : ""}`}
        >
          {[...todos]
            .sort((todoA, todoB) => {
              const statusOrder: Record<string, number> = {
                completed: 0,
                in_progress: 1,
                pending: 2,
                error: 3,
              };
              return (
                (statusOrder[todoA.status] ?? 99) -
                (statusOrder[todoB.status] ?? 99)
              );
            })
            .map((todo, index) => (
              <div
                key={index}
                className={`todo-item todo-item--${todo.status}`}
              >
                <span className="todo-status">
                  {todo.status === "completed" && (
                    <span className="todo-check">✓</span>
                  )}
                  {todo.status === "in_progress" && (
                    <span className="spinner-sm" />
                  )}
                  {todo.status === "pending" && (
                    <span className="todo-pending">○</span>
                  )}
                  {todo.status === "error" && (
                    <span className="todo-error">✗</span>
                  )}
                </span>
                <span className="todo-content">{todo.content}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

type ToolCallGroupProps = {
  toolCalls: ToolCallState[];
  isActive?: boolean;
  extractStateMap?: Map<string, ToolCallStateStatus>;
};

const ToolCallGroup = ({
  toolCalls,
  isActive,
  extractStateMap: globalExtractStateMap,
}: ToolCallGroupProps) => {
  const latestWriteTodosRunId = toolCalls.findLast(
    (tc) => tc.toolName === TOOL_KEYS.WRITE_TODOS,
  )?.runId;
  const anyRunning = toolCalls.some(
    (toolCall) => toolCall.state === ToolCallStateStatus.RUNNING,
  );
  const hasChart = toolCalls.some(
    (toolCall) =>
      toolCall.toolName === TOOL_KEYS.RENDER_CHART &&
      tryParseChart(toolCall.result),
  );
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!anyRunning && !isActive && !hasChart) {
      const timer = setTimeout(() => setExpanded(false), 5000);
      return () => clearTimeout(timer);
    }

    if (anyRunning || isActive) {
      setExpanded(true);
    }
  }, [anyRunning, isActive, hasChart]);

  const summaryText = getGroupSummary(toolCalls);

  // Merge web_extract display into web_search result items when both exist in the same group
  const hasWebSearch = toolCalls.some(
    (tc) =>
      (tc.toolName === TOOL_KEYS.WEB_SEARCH_TAVILY ||
        tc.toolName === TOOL_KEYS.WEB_SEARCH_EXA) &&
      parseResultItems(tc.toolName, tc.result, tc.input).length > 0,
  );

  const extractStateMap =
    globalExtractStateMap || new Map<string, ToolCallStateStatus>();

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <ToolCallGroupWrapper expanded={expanded}>
      <div className="group-header" onClick={handleToggle}>
        <div className="group-summary">
          <span className="summary-text">{summaryText}</span>

          <div className="icon-wrapper">
            {expanded ? <DownArrowIcon /> : <ArrowRightIcon />}
          </div>
        </div>
      </div>

      <div className="group-content">
        <div className="group-content-inner">
          <div className="group-body">
            {toolCalls
              .filter((toolCall) => {
                if (HIDDEN_TOOL_NAMES.has(toolCall.toolName)) {
                  return false;
                }
                if (
                  hasWebSearch &&
                  toolCall.toolName === TOOL_KEYS.WEB_EXTRACT_TAVILY
                ) {
                  return false;
                }
                if (
                  toolCall.toolName === TOOL_KEYS.WRITE_TODOS &&
                  latestWriteTodosRunId &&
                  toolCall.runId !== latestWriteTodosRunId
                ) {
                  return false;
                }
                return true;
              })
              .map((toolCall) => (
                <ToolCallRow
                  key={toolCall.runId}
                  toolCall={toolCall}
                  extractStateMap={extractStateMap}
                />
              ))}
          </div>

          {!anyRunning && isActive && (
            <div className="thinking-row">
              <span className="thinking-icon">
                <span className="spinner-thinking" />
              </span>
              <span className="thinking-label">Thinking…</span>
            </div>
          )}

          {!anyRunning && !isActive && (
            <div className="done-row">
              <span className="done-icon">
                <CheckCircleIcon />
              </span>
              <span className="done-label">Done</span>
            </div>
          )}
        </div>
      </div>
    </ToolCallGroupWrapper>
  );
};

export { ToolCallGroup };
