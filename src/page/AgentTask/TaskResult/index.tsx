import type { CSSProperties } from "react";
import { useState, useEffect, Fragment } from "react";
import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import { Wrapper } from "./style";

interface TaskResultProps {
  task: IAgentTask;
}

export const TaskResult = ({ task }: TaskResultProps) => {
  const { translate } = useTranslation();
  const [isResultOpen, setIsResultOpen] = useState(true);
  const [isErrorOpen, setIsErrorOpen] = useState(true);

  useEffect(() => {
    setIsResultOpen(true);
    setIsErrorOpen(true);
  }, [task.id]);

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
        <Wrapper style={{ "--dot-color": "#22c55e" } as CSSProperties}>
          <div
            className="result-header"
            onClick={() => setIsResultOpen((prev) => !prev)}
          >
            <span className="result-dot" />
            <span className="result-label">
              {translate("agentTask.label.result")}
            </span>
            <span
              className={`result-chevron${isResultOpen ? " result-chevron--open" : ""}`}
            />
          </div>

          {isResultOpen && (
            <div className="result-body">
              <pre>{JSON.stringify(task.result, null, 2)}</pre>
            </div>
          )}
        </Wrapper>
      )}

      {hasError && (
        <Wrapper style={{ "--dot-color": "#f97316" } as CSSProperties}>
          <div
            className="result-header"
            onClick={() => setIsErrorOpen((prev) => !prev)}
          >
            <span className="result-dot" />
            <span className="result-label">
              {translate("agentTask.label.errorMessage")}
            </span>
            <span
              className={`result-chevron${isErrorOpen ? " result-chevron--open" : ""}`}
            />
          </div>

          {isErrorOpen && (
            <div className="result-body">
              <pre>{task.errorMessage}</pre>
            </div>
          )}
        </Wrapper>
      )}
    </Fragment>
  );
};
