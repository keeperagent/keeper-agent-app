import type { ReactNode } from "react";
import { Fragment } from "react";
import { Collapse } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { useTranslation, sendOpenExternalLink } from "@/hook";
import TokenUsageBadge from "@/component/AgentChatView/TokenUsageBadge";
import { Wrapper } from "./style";

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        if (href) {
          sendOpenExternalLink(href);
        }
      }}
    >
      {children}
    </a>
  ),
};

const renderResultContent = (result: any): ReactNode => {
  if (
    result !== null &&
    typeof result === "object" &&
    typeof result.value === "string"
  ) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {result.value}
      </ReactMarkdown>
    );
  }
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
};

interface TaskResultProps {
  task: IAgentTask;
}

export const TaskResult = ({ task }: TaskResultProps) => {
  const { translate } = useTranslation();

  const isDone = task.status === AgentTaskStatus.DONE;
  const isFailed = task.status === AgentTaskStatus.FAILED;
  const hasResult = isDone && task.result != null;
  const hasError = isFailed && Boolean(task.errorMessage);

  if (!hasResult && !hasError) {
    return null;
  }

  return (
    <Fragment>
      {hasResult && (
        <Wrapper>
          <Collapse
            defaultActiveKey={["result"]}
            size="small"
            expandIconPosition="end"
            items={[
              {
                key: "result",
                label: (
                  <div className="result-header">
                    <span className="result-label">
                      {translate("agentTaskResultLabel")}
                    </span>
                    {task.result?.tokenUsage && (
                      <TokenUsageBadge turnUsage={task.result.tokenUsage} />
                    )}
                  </div>
                ),
                children: (
                  <div className="result-body">
                    {renderResultContent(task.result)}
                  </div>
                ),
              },
            ]}
          />
        </Wrapper>
      )}

      {hasError && (
        <Wrapper>
          <Collapse
            defaultActiveKey={["error"]}
            size="small"
            expandIconPosition="end"
            items={[
              {
                key: "error",
                label: (
                  <div className="result-header">
                    <span className="result-label">
                      {translate("agentTaskErrorMessageLabel")}
                    </span>
                  </div>
                ),
                children: (
                  <div className="result-body">
                    <pre>{task.errorMessage}</pre>
                  </div>
                ),
              },
            ]}
          />
        </Wrapper>
      )}
    </Fragment>
  );
};
