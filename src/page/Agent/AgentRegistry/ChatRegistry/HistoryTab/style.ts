import styled from "styled-components";

export const HistoryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 1.2rem 1.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .history-item {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    overflow: hidden;
    background: var(--background-card);
  }

  .history-item-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--background-hover);
    }
  }

  .history-item-time {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    flex: 1;
  }

  .history-item-body {
    padding: 0.8rem 1.2rem;
    border-top: 1px solid var(--border-color);
    font-size: 1.2rem;
    color: var(--color-text);
    max-height: 30rem;
    overflow-y: auto;

    .markdown-result {
      font-size: 1.2rem;
      line-height: 1.6;

      p {
        margin: 0 0 0.6rem;
      }
      pre {
        overflow-x: auto;
      }
    }

    .error-text {
      color: var(--color-error);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  .history-pagination {
    display: flex;
    justify-content: center;
    padding: 1.2rem 1.6rem;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 4rem;
  }

  .empty-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 4rem;
  }
`;
