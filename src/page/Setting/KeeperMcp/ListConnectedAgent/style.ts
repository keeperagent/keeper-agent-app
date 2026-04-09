import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ListConnectedAgentRoot = styled.div`
  .section-wrapper {
    margin-bottom: 5rem;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.2rem;

      .section-title {
        margin-bottom: 0;
        font-size: 1.1rem;
        font-weight: 600;
        text-transform: uppercase;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      }
    }
  }

  .empty {
    & * {
      font-size: 1.3rem;
    }

    svg {
      width: 7rem;
    }
  }

  .connection-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .connection-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    border-radius: 0.6rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};
    margin-top: 0.7rem;
    transition:
      border-color 0.15s ease,
      border-style 0.15s ease;

    &:hover {
      border-color: var(--color-primary);
      border-style: dashed;

      .connection-info {
        .connection-name {
          color: var(--color-text-hover);
        }
      }
    }

    .connection-dot {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: var(--color-success);
    }

    .connection-info {
      flex: 1;
      min-width: 0;

      .connection-name {
        font-size: 1.3rem;
        font-weight: 600;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        margin-bottom: 0.5rem;
        transition: color 0.15s ease;

        .session-count {
          font-size: 1rem;
          font-weight: 400;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
        }
      }

      .connection-time {
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
        margin-top: 0.2rem;
      }
    }
  }
`;
