import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const ToolCallGroupWrapper = styled.div<{ expanded: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ expanded }) => (expanded ? "0.8rem" : "0.4rem")};

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    padding: 0.2rem 0;
    user-select: none;

    &:hover .summary-text {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    .group-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      margin-bottom: 0.7rem;

      .icon-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.5rem;
        height: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;

        svg {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          min-height: 1.5rem;
        }
      }
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      border-top-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorPrimary || "#1677ff"};
      border-radius: 50%;
      animation: ${spin} 0.8s linear infinite;
      flex-shrink: 0;
    }

    .summary-text {
      font-size: 1.15rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.15s ease;
    }
  }

  .group-content {
    display: grid;
    grid-template-rows: ${({ expanded }) => (expanded ? "1fr" : "0fr")};
    transition: grid-template-rows 0.5s ease;
  }

  .group-content-inner {
    overflow: hidden;
    min-height: 0;
  }

  .group-body {
    position: relative;
    display: flex;
    flex-direction: column;
    margin-left: 0.45rem;
    padding-left: 1.6rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    gap: 0.8rem;

    &::before {
      content: "";
      position: absolute;
      left: 0.5rem;
      top: 0;
      bottom: 0;
      width: 1px;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    }
  }

  .done-row,
  .thinking-row {
    position: relative;
    display: flex;
    align-items: center;
    margin-left: calc(0.45rem + 1.6rem);
    margin-top: 0.5rem;

    .done-icon {
      position: absolute;
      left: -1.7rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 1.2rem;
        height: 1.2rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }

    .done-label {
      font-size: 1.2rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-left: 0.3rem;
    }

    .thinking-icon {
      position: absolute;
      left: -1.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.2rem;
      height: 1.2rem;
    }

    .spinner-thinking {
      width: 1rem;
      height: 1rem;
      border: 1.5px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      border-top-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorPrimary || "#1677ff"};
      border-radius: 50%;
      animation: ${spin} 0.8s linear infinite;
    }

    .thinking-label {
      font-size: 1.2rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-left: 0.3rem;
    }
  }

  .tool-row {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .tool-icon {
      position: absolute;
      left: -1.7rem;
      top: 0.1rem;
      width: 1.2rem;
      text-align: center;
      font-size: 1.2rem;
      line-height: 1;
      padding: 0.2rem 0;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
      border-radius: 4px;
      z-index: 1;
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
      }

      .input-summary {
        font-size: 1.15rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        max-height: 10rem;
        overflow-y: auto;

        &.input-summary-md {
          font-size: 1.15rem;
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
          line-height: 1.6;
          word-break: break-word;

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            margin: 0.8rem 0 0.4rem;
            font-weight: 600;
            font-size: 1.15rem;
          }
          h1:first-child,
          h2:first-child,
          h3:first-child {
            margin-top: 0;
          }
          p {
            margin: 0.4rem 0;
          }
          p:first-child {
            margin-top: 0;
          }
          p:last-child {
            margin-bottom: 0;
          }
          ul,
          ol {
            margin: 0.4rem 0;
            padding-left: 1.4rem;
          }
          li {
            margin: 0.3rem 0;
          }
          strong {
            font-weight: 600;
          }
          code {
            background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
            padding: 0.15rem 0.4rem;
            border-radius: 3px;
            font-size: 1.1rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 1.15rem;
            margin: 0.5rem 0;
          }
          th,
          td {
            border: 1px solid
              ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
            padding: 0.3rem 0.6rem;
            text-align: left;
          }
          th {
            font-weight: 600;
            background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
          }
        }
      }

      .tool-status {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        margin-left: 0.5rem;
      }

      .spinner-sm {
        width: 1.3rem;
        height: 1.3rem;
        border: 1.5px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
        border-top-color: ${({ theme }: { theme: ITheme }) =>
          theme?.colorPrimary || "#1677ff"};
        border-radius: 50%;
        animation: ${spin} 0.8s linear infinite;
      }

      .result-count {
        font-size: 1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }

      .error-mark {
        color: var(--color-error, #ff4d4f);
        font-size: 1rem;
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

    .result-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.1rem;
      max-height: 20rem;
      overflow-y: auto;
      border: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorderSubtle};
      border-radius: 0.5rem;
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTransparentLight};
      padding: 0.5rem 0.5rem;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.3rem 0.45rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.12s ease;
      overflow: hidden;

      &:hover {
        background: ${({ theme }: { theme: ITheme }) => theme?.colorBgWorkflow};

        .result-title {
          color: var(--color-text-hover);
        }
      }

      .result-favicon {
        width: 1.4rem;
        height: 1.4rem;
        flex: 0 0 1.4rem;
        border-radius: 3px;
        object-fit: contain;
      }

      .result-title {
        font-size: 1.15rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .result-domain {
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        flex: 0 0 auto;
        white-space: nowrap;
        margin-left: 0.5rem;
      }
    }
  }
`;
