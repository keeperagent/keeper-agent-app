import styled from "styled-components";

export const MessageListWrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .message {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-width: 80%;

    &.user {
      align-self: flex-end;
      align-items: flex-end;
    }

    &.assistant {
      align-self: flex-start;
      align-items: flex-start;
    }
  }

  .message-label {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
  }

  .message-bubble {
    padding: 0.8rem 1.2rem;
    border-radius: 0.8rem;
    font-size: 1.3rem;
    line-height: 1.6;
    max-width: 100%;
    word-break: break-word;

    .user & {
      background: var(--color-primary);
      color: #fff;
    }

    .assistant & {
      background: var(--background-card);
      border: 1px solid var(--border-color);
      color: var(--color-text);
    }
  }

  .markdown-content {
    p {
      margin: 0 0 0.6rem;
      &:last-child {
        margin-bottom: 0;
      }
    }
    pre {
      overflow-x: auto;
      font-size: 1.2rem;
    }
    code {
      font-size: 1.2rem;
    }
    ul,
    ol {
      padding-left: 1.6rem;
    }
  }

  .tool-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.1rem;
    color: var(--color-primary);
    background: var(--background-blue);
    border-radius: 2rem;
    padding: 0.2rem 0.8rem;
    margin-top: 0.4rem;

    .spinner {
      width: 0.9rem;
      height: 0.9rem;
      border: 2px solid var(--color-primary);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-dots {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
    padding: 0.4rem 0;

    span {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      background: var(--color-text-secondary);
      animation: bounce 1.2s infinite ease-in-out;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`;
