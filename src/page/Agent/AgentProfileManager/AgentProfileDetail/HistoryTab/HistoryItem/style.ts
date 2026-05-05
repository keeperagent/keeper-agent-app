import styled from "styled-components";
import { ITheme } from "@/style/theme";
import { markdownStyles } from "@/style/markdown";

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

  .history-item-tag {
    text-transform: lowercase;
    flex-shrink: 0;
  }

  .history-item-title {
    flex: 1;
    min-width: 0;
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-item-meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .history-item-duration {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.8;
    letter-spacing: 0.02em;
  }

  .history-item-separator {
    font-size: 1.3rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.4;
  }

  .history-item-time {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .history-item-chevron {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .history-item-body {
    padding: 0.8rem 1.2rem 0;
    border-top: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgHistoryBody};
    font-size: 1.2rem;
    line-height: 1.6;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    max-height: 4rem;
    overflow: hidden;
    transition: max-height 0.25s ease;

    &.is-expanded {
      max-height: 30rem;
      overflow-y: auto;
    }

    .task-description {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      line-height: 1.5;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      margin-bottom: 0.8rem;
    }

    .preview-text {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
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

      ${markdownStyles}
    }

    .error-text {
      color: var(--color-error);
      white-space: pre-wrap;
      word-break: break-word;
      padding-bottom: 0.8rem;
    }
  }
`;
