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
