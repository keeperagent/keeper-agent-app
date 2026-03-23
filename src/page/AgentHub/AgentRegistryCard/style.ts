import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    padding: 1.2rem 1.4rem 0.8rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .card-name {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .card-body {
    padding: 0 1.4rem 1.2rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card-desc {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    min-height: 3.6rem;
  }

  .card-no-desc {
    font-style: italic;
    opacity: 0.5;
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .card-meta-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.2rem;
  }

  .card-meta-label {
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .card-meta-value {
    color: var(--color-text);
    font-weight: 500;
  }

  .card-footer {
    padding: 1rem 1.4rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover {
      background: var(--background-hover);
    }

    &.btn-delete:hover {
      background: var(--background-error-light);
    }
  }

  .btn-chat {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
`;
