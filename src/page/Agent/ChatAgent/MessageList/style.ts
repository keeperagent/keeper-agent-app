import styled from "styled-components";
import { ITheme } from "@/style/theme";

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
    margin-bottom: var(--margin-bottom-small);

    &.user {
      align-items: flex-end;
      width: 100%;

      .message-content {
        flex-direction: row;
        justify-content: flex-end;
        align-items: flex-end;
        width: 100%;
        max-width: 100%;
      }

      .message-bubble-wrapper {
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        max-width: 75%;
      }

      .bubble {
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgUserMessage};
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      }

      .message-footer {
        justify-content: flex-end;
      }
    }

    &.assistant {
      align-items: flex-start;

      .message-content {
        flex-direction: row;
      }

      .message-bubble-wrapper {
        align-items: flex-start;
      }

      .bubble {
        background: transparent;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        border: none;
        box-shadow: none;
        padding-left: 0;
        padding-right: 0;
        padding-bottom: 0;
      }

      .message-footer {
        justify-content: flex-start;
      }
    }

    .message-content {
      display: flex;
      align-items: flex-end;
      gap: 0.8rem;
      max-width: 100%;
    }

    .message-bubble-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 100%;
    }

    .bubble {
      padding: var(--padding-small);
      border-radius: 1.2rem;
      font-size: 1.3rem;
      line-height: 1.7rem;
      word-break: break-word;
      box-shadow: var(--shadow-sm);

      &:not(:has(.markdown-content)) {
        white-space: pre-wrap;
      }

      .markdown-content {
        white-space: normal;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 1rem 0 0.5rem 0;
          font-weight: 600;
          line-height: 1.3;
          color: inherit;
        }
        h1,
        h2 {
          font-size: 1.55rem;
        }
        h3,
        h4,
        h5,
        h6 {
          font-size: 1.35rem;
        }
        h1:first-child,
        h2:first-child,
        h3:first-child {
          margin-top: 0;
        }

        a {
          color: var(--primary-light);
        }

        p {
          margin: 0.5rem 0;
          color: inherit;
        }
        p:first-child {
          margin-top: 0;
        }
        p:last-child {
          margin-bottom: 0;
        }

        strong {
          font-weight: 600;
          color: inherit;
        }

        em,
        li,
        td,
        th,
        blockquote {
          color: inherit;
        }

        code {
          background: ${({ theme }: { theme: ITheme }) =>
            theme?.colorBgTag || "rgba(0,0,0,0.08)"};
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 1.2rem;
          color: var(--color-error);
          border: 1px solid
            ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
        }
        pre {
          margin: 0.75rem 0;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          background: ${({ theme }: { theme: ITheme }) =>
            theme?.colorBgTag || "rgba(0,0,0,0.06)"};
        }
        pre code {
          background: none;
          padding: 0;
        }

        ul,
        ol {
          margin: 0.5rem 0 0.5rem 0;
          padding-left: 1.5rem;
        }
        li {
          margin: 0.5rem 0;
        }

        table {
          width: 100%;
          margin: 0.75rem 0;
          border-collapse: collapse;
          font-size: 1.24rem;
        }
        th,
        td {
          border: 1px solid
            ${({ theme }: { theme: ITheme }) => theme?.colorBorder || "#eee"};
          padding: 0.4rem 0.6rem;
          text-align: left;
        }
        th {
          font-weight: 600;
          background: ${({ theme }: { theme: ITheme }) =>
            theme?.colorBgTag || "rgba(0,0,0,0.04)"};
        }
      }
    }

    .message-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .timestamp {
      font-size: 1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .copy-icon {
      height: 1.2rem;
      width: 1.2rem;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      margin-left: 0.5rem;

      &.copied {
        svg {
          fill: var(--color-success);
        }
      }

      &:hover {
        opacity: 1;
      }

      svg {
        width: 100%;
        height: 100%;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
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
