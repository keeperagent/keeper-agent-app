import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  .chat-header {
    flex-shrink: 0;
  }

  .chat-header-top {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 0.8rem 1.6rem 0.6rem;

    .btn-back {
      flex-shrink: 0;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      font-size: 1.3rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;

      .btn-back-icon {
        display: inline-flex;
        align-items: center;

        svg {
          width: 1.4rem;
          height: 1.4rem;
          fill: currentColor;
        }
      }
    }

    .chain-logo {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
      padding: 0.5rem;
    }

    .chat-agent-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .chat-agent-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chat-agent-desc {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .chat-tabs {
    padding: 0 1.6rem;

    .ant-tabs-nav {
      margin-bottom: 0;
    }
  }

  .chat-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .chat-composer {
    flex-shrink: 0;
    padding: 1.2rem 1.6rem;
  }

  .chat-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    padding: 3rem;
    height: 100%;

    .empty-icon {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;

      img {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .empty-name {
      font-size: 2rem;
      font-weight: 700;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    .empty-hint {
      font-size: 1.3rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .empty-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .empty-suggestion-chip {
      padding: 0.6rem 1.2rem;
      border-radius: 2rem;
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
    }
  }

  .loading-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

export const ContextChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.3rem;
  border-radius: var(--border-radius-1);
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  flex-shrink: 0;

  img {
    width: 2.3rem;
    height: 2.3rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    align-self: center;
  }

  span {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    white-space: nowrap;
  }

  .chip-value {
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .chip-label {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .chip-lines {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;

    span {
      line-height: 1.3;
    }
  }
`;
