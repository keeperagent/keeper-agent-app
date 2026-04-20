import { useEffect, useMemo, useState } from "react";
import { TOOL_KEYS } from "@/electron/constant";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  DownArrowIcon,
} from "@/component/Icon";
import { type ToolCallState, ToolCallStateStatus } from "../util";
import {
  parseWebSearchResultItems,
  getGroupSummary,
  tryParseChart,
  HIDDEN_TOOL_NAMES,
} from "./util";
import { Wrapper } from "./style";
import ToolCallRow from "./ToolCallRow";

type ToolCallGroupProps = {
  toolCalls: ToolCallState[];
  isActive?: boolean;
  extractWebStateMap?: Map<string, ToolCallStateStatus>;
};

const ToolCallGroup = ({
  toolCalls,
  isActive,
  extractWebStateMap: globalExtractWebStateMap,
}: ToolCallGroupProps) => {
  const [expanded, setExpanded] = useState(true);

  const latestWriteTodosRunId = toolCalls.findLast(
    (toolCall) => toolCall.toolName === TOOL_KEYS.WRITE_TODOS,
  )?.runId;
  const anyRunning = toolCalls.some(
    (toolCall) => toolCall.state === ToolCallStateStatus.RUNNING,
  );
  const hasChart = toolCalls.some(
    (toolCall) =>
      toolCall.toolName === TOOL_KEYS.RENDER_CHART &&
      tryParseChart(toolCall.result),
  );

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

  const hasWebSearch = toolCalls.some(
    (toolCall) =>
      (toolCall.toolName === TOOL_KEYS.WEB_SEARCH_TAVILY ||
        toolCall.toolName === TOOL_KEYS.WEB_SEARCH_EXA) &&
      parseWebSearchResultItems(
        toolCall.toolName,
        toolCall.result,
        toolCall.input,
      ).length > 0,
  );

  const extractWebStateMap =
    globalExtractWebStateMap || new Map<string, ToolCallStateStatus>();

  const visibleToolCalls = useMemo(
    () =>
      toolCalls.filter((toolCall) => {
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
      }),
    [toolCalls, hasWebSearch, latestWriteTodosRunId],
  );

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <Wrapper expanded={expanded}>
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
            {visibleToolCalls.map((toolCall) => (
              <ToolCallRow
                key={toolCall.runId}
                toolCall={toolCall}
                extractWebStateMap={extractWebStateMap}
              />
            ))}
          </div>

          {!anyRunning && isActive && (
            <div className="thinking-row">
              <span className="thinking-icon">
                <span className="spinner-thinking" />
              </span>
              <span className="thinking-label">Thinking</span>
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
    </Wrapper>
  );
};

export default ToolCallGroup;
