import { Fragment } from "react";
import { Tooltip } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TOOL_KEYS } from "@/electron/constant";
import CodeEditor from "@/component/CodeEditor";
import { type ToolCallState, ToolCallStateStatus } from "../../util";
import {
  getToolIcon,
  getToolLabel,
  getSummaryPairs,
  parseWebSearchResultItems,
  getCodeContent,
  looksLikeMarkdown,
  parseTodos,
  tryParseChart,
  SEARCH_TOOL_NAMES,
  TodoItemStatus,
} from "../util";
import ChartResult from "../ChartResult";
import TodoList from "../TodoList";
import WebSearchResult from "../WebSearchResult";
import { ToolCallRowWrapper } from "./style";

const parseIsRejected = (result: string | undefined): boolean => {
  try {
    return JSON.parse(result || "")?.status === "rejected";
  } catch {
    return false;
  }
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
  extractWebStateMap?: Map<string, ToolCallStateStatus>;
};

const ToolCallRow = ({ toolCall, extractWebStateMap }: ToolCallRowProps) => {
  const summaryPairs = getSummaryPairs(toolCall.toolName, toolCall.input);
  const webSearchResultItems = parseWebSearchResultItems(
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

  const isRejected =
    toolCall.toolName === TOOL_KEYS.CONFIRM_APPROVAL &&
    parseIsRejected(toolCall.result);
  const toolIcon = isRejected ? "✗" : getToolIcon(toolCall.toolName);

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
      <span className={`tool-icon${isRejected ? " tool-icon--error" : ""}`}>
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
              webSearchResultItems.length > 0 && (
                <span className="result-count">
                  {webSearchResultItems.length} results
                </span>
              )}

            {todos && todos.length > 0 && (
              <span className="todo-counter">
                {
                  todos.filter(
                    (todo) => todo.status === TodoItemStatus.COMPLETED,
                  ).length
                }
                /{todos.length} done
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

      {webSearchResultItems.length > 0 && (
        <WebSearchResult
          items={webSearchResultItems}
          extractWebStateMap={extractWebStateMap}
        />
      )}

      {chartData && (
        <ChartResult option={chartData.option} height={chartData.height} />
      )}

      {todos && todos?.length > 0 && <TodoList todos={todos} />}
    </ToolCallRowWrapper>
  );
};

export default ToolCallRow;
