import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  getCodeLanguage,
  looksLikeMarkdown,
  SEARCH_TOOL_NAMES,
} from "./util";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  DownArrowIcon,
} from "@/component/Icon";
import { ToolCallGroupWrapper } from "./style";
import { MESSAGE } from "@/electron/constant";
import CodeEditor from "@/component/CodeEditor";

type ToolCallRowProps = {
  toolCall: ToolCallState;
};

const ToolCallRow = ({ toolCall }: ToolCallRowProps) => {
  const summaryPairs = getSummaryPairs(toolCall.toolName, toolCall.input);
  const resultItems = parseResultItems(toolCall.toolName, toolCall.result);
  const isSearchTool = SEARCH_TOOL_NAMES.has(toolCall.toolName as any);
  const codeContent = getCodeContent(
    toolCall.toolName,
    toolCall.input,
    toolCall.result,
  );
  const codeLanguage = getCodeLanguage(toolCall.toolName);

  // For search tools use the first summary value (query/url) as the primary visible label
  const primaryLabel =
    isSearchTool && summaryPairs.length > 0
      ? summaryPairs[0].value
      : getToolLabel(toolCall.toolName);

  // Remaining fields shown as secondary summary (non-search tools only)
  const secondarySummary = isSearchTool
    ? ""
    : summaryPairs.map((pair) => pair.value).join(" · ");

  return (
    <div className="tool-row">
      <span className="tool-icon">{getToolIcon(toolCall.toolName)}</span>
      <div className="tool-row-header">
        <div className="tool-row-top">
          <span className="tool-name">{primaryLabel}</span>
          <div className="tool-status">
            {toolCall.state === ToolCallStateStatus.RUNNING && (
              <span className="spinner-sm" />
            )}
            {toolCall.state === ToolCallStateStatus.DONE &&
              resultItems.length > 0 && (
                <span className="result-count">
                  {resultItems.length} results
                </span>
              )}
            {toolCall.state === ToolCallStateStatus.ERROR && (
              <span className="error-mark">✗</span>
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
          language={codeLanguage}
          readOnly
          height="auto"
          fontSize={12}
          className="code-block"
        />
      )}

      {resultItems.length > 0 && (
        <div className="result-items">
          {resultItems.map((resultItem, index) => (
            <div
              key={index}
              className="result-item"
              onClick={() =>
                window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
                  url: resultItem.url,
                })
              }
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
              <span className="result-domain">
                {extractDomain(resultItem.url)}
              </span>
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
};

const ToolCallGroup = ({ toolCalls, isActive }: ToolCallGroupProps) => {
  const anyRunning = toolCalls.some(
    (toolCall) => toolCall.state === ToolCallStateStatus.RUNNING,
  );
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!anyRunning && !isActive) {
      const timer = setTimeout(() => setExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
    if (anyRunning || isActive) {
      setExpanded(true);
    }
  }, [anyRunning, isActive]);

  const summaryText = getGroupSummary(toolCalls);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <ToolCallGroupWrapper expanded={expanded}>
      <div className="group-header" onClick={handleToggle}>
        <div className="group-summary">
          {anyRunning && <span className="spinner" />}

          <span className="summary-text">{summaryText}</span>

          <div className="icon-wrapper">
            {expanded ? <DownArrowIcon /> : <ArrowRightIcon />}
          </div>
        </div>
      </div>

      <div className="group-content">
        <div className="group-content-inner">
          <div className="group-body">
            {toolCalls.map((toolCall) => (
              <ToolCallRow key={toolCall.runId} toolCall={toolCall} />
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
