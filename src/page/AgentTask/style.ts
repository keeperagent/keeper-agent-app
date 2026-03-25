import styled from "styled-components";

export const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 1.4rem;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1.6rem 0;
    flex-shrink: 0;

    .header-title {
      font-size: 1.8rem;
      font-weight: 600;
    }
  }

  .board {
    flex: 1;
    display: flex;
    gap: 1.2rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.8rem;
  }
`;

export const KanbanColumn = styled.div<{ isDragOver?: boolean }>`
  flex: 0 0 26rem;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary, #1e1e2e);
  border-radius: 1rem;
  overflow: hidden;
  border: 1.5px solid
    ${(props) =>
      props.isDragOver
        ? "var(--color-primary, #6c63ff)"
        : "var(--color-border, rgba(255,255,255,0.08))"};
  transition: border-color 0.15s ease;

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.4rem;
    background: var(--color-bg-tertiary, #13131f);
    flex-shrink: 0;

    .column-title {
      font-weight: 600;
      font-size: 1.3rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .column-count {
      background: var(--color-bg-secondary, #1e1e2e);
      color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
      border-radius: 10rem;
      padding: 0.1rem 0.7rem;
      font-size: 1.2rem;
      font-weight: 500;
    }
  }

  .column-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    min-height: 10rem;
  }
`;

export const TaskCard = styled.div<{ isDragging?: boolean }>`
  background: var(--color-bg-primary, #111120);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  border-radius: 0.8rem;
  padding: 1.2rem;
  cursor: grab;
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: var(--color-primary, #6c63ff);
    box-shadow: 0 2px 12px rgba(108, 99, 255, 0.15);
  }

  .task-title {
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-text-primary, #fff);
    line-height: 1.4;
    word-break: break-word;
  }

  .task-description {
    font-size: 1.2rem;
    color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .task-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .task-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .task-actions {
    opacity: 1;
  }

  .task-agent {
    font-size: 1.1rem;
    color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .task-due {
    font-size: 1.1rem;
    color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  }
`;

export const PriorityBadge = styled.span<{ priority: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.7rem;
  border-radius: 10rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${(props) => {
    switch (props.priority) {
      case "URGENT":
        return "rgba(239, 68, 68, 0.15)";
      case "HIGH":
        return "rgba(249, 115, 22, 0.15)";
      case "MEDIUM":
        return "rgba(234, 179, 8, 0.15)";
      default:
        return "rgba(148, 163, 184, 0.15)";
    }
  }};
  color: ${(props) => {
    switch (props.priority) {
      case "URGENT":
        return "#ef4444";
      case "HIGH":
        return "#f97316";
      case "MEDIUM":
        return "#eab308";
      default:
        return "#94a3b8";
    }
  }};
`;
