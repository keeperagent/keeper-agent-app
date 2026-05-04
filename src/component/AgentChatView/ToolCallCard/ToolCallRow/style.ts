import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";
import { markdownStyles } from "@/style/markdown";

const textScan = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const dotPulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.8); transform: scale(1); }
  70%  { box-shadow: 0 0 0 6px rgba(82, 196, 26, 0); transform: scale(1.15); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); transform: scale(1); }
`;

export const ToolCallRowWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;

  .tool-icon {
    position: absolute;
    left: -1.75rem;
    top: 0;
    width: 1.4rem;
    text-align: center;
    font-size: 1.4rem;
    line-height: 1;
    padding: 0.2rem 0;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
    border-radius: 4px;
    z-index: 1;

    &.tool-icon--error {
      color: var(--color-error, #ff4d4f);
      font-size: 2rem;
      font-weight: 700;
      margin-top: -0.5rem;
    }
  }

  .tool-row-header {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    .tool-row-top {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
    }

    .tool-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.tool-name--running {
        background: linear-gradient(
          90deg,
          ${({ theme }: { theme: ITheme }) =>
              theme?.colorTextSecondary || "#888"}
            0%,
          ${({ theme }: { theme: ITheme }) =>
              theme?.colorTextSecondary || "#888"}
            30%,
          var(--color-text-hover, #fff) 50%,
          ${({ theme }: { theme: ITheme }) =>
              theme?.colorTextSecondary || "#888"}
            70%,
          ${({ theme }: { theme: ITheme }) =>
              theme?.colorTextSecondary || "#888"}
            100%
        );
        background-size: 200% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: ${textScan} 3s linear infinite;
      }

      .tool-name-dim {
        font-size: 1rem;
        font-weight: 400;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }

    .input-summary {
      padding: 0.5rem 0;
      font-size: 1.15rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      max-height: 10rem;
      overflow-y: auto;

      &.input-summary-md {
        white-space: normal;
        font-size: 1.15rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        line-height: 1.6;
        word-break: break-word;

        ${markdownStyles}
      }
    }

    .tool-status {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-left: 0.5rem;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success, #52c41a);
      flex-shrink: 0;
      animation: ${dotPulse} 1.4s ease-in-out infinite;
    }

    .result-count {
      font-size: 1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .todo-counter {
      font-size: 1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .error-mark {
      color: var(--color-error, #ff4d4f);
      font-size: 2rem;
      font-weight: 700;
    }
  }

  .code-block {
    margin: 0.3rem 0 0;
    max-height: 20rem;
    overflow-y: auto;
    border-radius: 0.4rem;
    border: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorderSubtle};

    .cm-editor {
      border-radius: 0.4rem;
    }
  }
`;
