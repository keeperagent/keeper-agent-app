import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const HistoryItemWrapper = styled.div`
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: var(--border-radius);
  overflow: hidden;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgUserMessage};

  .history-item-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;

    &:hover {
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
    }
  }

  .history-item-time {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    flex: 1;
  }

  .history-item-body {
    padding: 0.8rem 1.2rem 0;
    border-top: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    font-size: 1.2rem;
    line-height: 1.6;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    max-height: 4rem;
    overflow: hidden;
    transition: max-height 0.25s ease;

    &.is-expanded {
      max-height: 30rem;
    }

    .preview-text {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-bottom: 0.8rem;

      &--error {
        color: var(--color-error);
      }
    }

    .markdown-result {
      font-size: 1.2rem;
      line-height: 1.6;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      padding-bottom: 0.8rem;

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
        font-size: 1.4rem;
      }
      h3,
      h4,
      h5,
      h6 {
        font-size: 1.2rem;
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
        margin: 0 0 0.6rem;
        color: inherit;
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
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
        font-family: "Courier New", Courier, monospace;
      }

      pre {
        margin: 0.6rem 0;
        padding: 0.8rem 1rem;
        border-radius: 6px;
        overflow-x: auto;
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTag || "rgba(0,0,0,0.06)"};
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      }
      pre code {
        background: none;
        border: none;
        padding: 0;
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }

      ul,
      ol {
        margin: 0.4rem 0;
        padding-left: 1.5rem;
      }
      li {
        margin: 0.3rem 0;
      }

      table {
        width: 100%;
        margin: 0.6rem 0;
        border-collapse: collapse;
        font-size: 1.2rem;
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

    .error-text {
      color: var(--color-error);
      white-space: pre-wrap;
      word-break: break-word;
      padding-bottom: 0.8rem;
    }
  }
`;
