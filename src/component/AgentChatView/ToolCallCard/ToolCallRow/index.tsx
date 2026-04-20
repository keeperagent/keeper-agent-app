import { Fragment } from "react";
import { Tooltip } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MESSAGE, TOOL_KEYS } from "@/electron/constant";
import CodeEditor from "@/component/CodeEditor";
import { type ToolCallState, ToolCallStateStatus } from "../../util";
import {
  getToolIcon,
  getToolLabel,
  getSummaryPairs,
  parseResultItems,
  extractDomain,
  getFaviconUrl,
  getCodeContent,
  looksLikeMarkdown,
  parseTodos,
  normalizeUrl,
  tryParseChart,
  SEARCH_TOOL_NAMES,
  TodoItemStatus,
} from "../util";
import ChartResult from "../ChartResult";
import TodoList from "../TodoList";
import { ToolCallRowWrapper } from "./style";

const openExternalUrl = (url: string): void => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, { url });
    }
  } catch {}
};

const formatTaskToolPrimaryLabel = (label: string) => {
  const suffix = [" subagent", " agent"].find((suffix) =>
    label.toLowerCase().endsWith(suffix),
  );
  if (!suffix) {
    return label;
  }

  return (
    <Fragment>
      {label.slice(0, -suffix.length)}
      <span className="tool-name-dim">{suffix}</span>
    </Fragment>
  );
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
  const isSearchTool = SEARCH_TOOL_NAMES.has(toolCall.toolName);
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
    ? todos.filter((todo) => todo.status === TodoItemStatus.COMPLETED).length
    : 0;
  const totalCount = todos?.length || 0;

  const toolIcon = (() => {
    if (toolCall.toolName === TOOL_KEYS.CONFIRM_APPROVAL && toolCall.result) {
      try {
        const parsed = JSON.parse(toolCall.result);
        if (parsed?.status === "rejected") {
          return "✗";
        }
      } catch {}
    }
    return getToolIcon(toolCall.toolName);
  })();

  let primaryLabel = "";
  if (isSearchTool && summaryPairs.length > 0) {
    primaryLabel = summaryPairs[0].value;
  } else if (isTaskTool && summaryPairs.length > 0) {
    primaryLabel = getToolLabel(summaryPairs[0].value);
  } else {
    primaryLabel = getToolLabel(toolCall.toolName);
  }

  let secondarySummary = "";
  if (!isSearchTool) {
    secondarySummary = isTaskTool
      ? summaryPairs
          .slice(1)
          .map((pair) => pair.value)
          .join(" · ")
      : summaryPairs.map((pair) => pair.value).join(" · ");
  }

  return (
    <ToolCallRowWrapper>
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
              ? formatTaskToolPrimaryLabel(primaryLabel)
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

      {todos && todos.length > 0 && <TodoList todos={todos} />}
    </ToolCallRowWrapper>
  );
};

export default ToolCallRow;
