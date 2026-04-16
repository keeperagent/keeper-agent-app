import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const dotBounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const paperPlaneFly = keyframes`
  0% {
    transform: translate(0, 0) rotate(-30deg) scale(1);
    opacity: 1;
  }
  15% {
    transform: translate(-10px, 8px) rotate(-32deg) scale(0.98);
    opacity: 1;
  }
  25% {
    transform: translate(-5px, 4px) rotate(-30deg) scale(0.95);
    opacity: 1;
  }
  60% {
    transform: translate(150px, -200px) rotate(-15deg) scale(0.7);
    opacity: 0.8;
  }
  100% {
    transform: translate(400px, -600px) rotate(10deg) scale(0.2);
    opacity: 0;
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const ExecutingToolBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.8rem 0.3rem 0.5rem;
  border-radius: 2rem;
  background: ${({ theme }: { theme: ITheme }) =>
    theme?.colorBgTag || "rgba(0,0,0,0.06)"};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  font-size: 1.2rem;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  white-space: nowrap;

  .spinner {
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    border-top-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorPrimary || "#1677ff"};
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
    flex-shrink: 0;
  }
`;

const DropOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--border-radius);
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 500;
`;

const AgentChatViewWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  .hidden-file-input {
    display: none;
  }

  .error-alert {
    margin-bottom: var(--margin-bottom);
  }

  .conversation {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--padding-small);
    border: none;
    border-radius: var(--border-radius);
    background-color: transparent;
    max-height: 100%;

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
        width: 100%;

        .message-content {
          flex-direction: row;
          width: 100%;
        }

        .message-bubble-wrapper {
          align-items: flex-start;
          width: 100%;
        }

        .bubble {
          background: transparent;
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          border: none;
          box-shadow: none;
          padding-left: 0;
          padding-right: 0;
          padding-bottom: 0;
          width: 100%;
        }

        .message-footer {
          justify-content: flex-start;
        }
      }

      &.tool {
        align-items: flex-start;

        .label {
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        }

        .bubble {
          background: transparent;
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
          border: none;
          box-shadow: none;
          padding-left: 0;
          padding-right: 0;
          font-size: 1.1rem;
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

      .label {
        font-size: 1.1rem;
        margin-bottom: 0.4rem;
        font-weight: 600;
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

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            margin: 1rem 0 0.5rem 0;
            font-weight: 600;
            line-height: 1.3;
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
          }
          p:first-child {
            margin-top: 0;
          }
          p:last-child {
            margin-bottom: 0;
          }

          strong {
            font-weight: 600;
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
          animation: slideDown 0.3s ease-in-out;

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
  }

  .composer {
    margin-top: var(--margin-top);
    padding: 0 var(--padding-small);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
`;

const LoadingDotsWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: 0.3em;
  vertical-align: middle;

  span {
    display: inline-block;
    width: 0.4em;
    height: 0.4em;
    border-radius: 50%;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextPrimary};
    margin: 0 0.15em;
    animation: ${dotBounce} 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }

    &:nth-child(3) {
      animation-delay: 0s;
    }
  }
`;

const PaperPlaneAnimation = styled.div<{ left?: string; top?: string }>`
  position: fixed;
  left: ${(props) => props.left || "50%"};
  top: ${(props) => props.top || "50%"};
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10000;
  animation: ${paperPlaneFly} 2s ease-out forwards;
  will-change: transform, opacity;

  svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
`;

const ComposerStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
`;

const SecretWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-secondary, #666);
`;

export {
  AgentChatViewWrapper,
  DropOverlay,
  LoadingDotsWrapper,
  PaperPlaneAnimation,
  ExecutingToolBadge,
  ComposerStatus,
  SecretWarning,
};
