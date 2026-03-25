import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ListAuthTokenRoot = styled.div`
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

  .loading-center {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }

  .token-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .token-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    border-radius: 0.6rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};
    margin-top: 0.7rem;

    &:hover {
      border-color: var(--color-primary);
      border-style: dashed;

      .token-info {
        .token-name {
          color: var(--color-text-hover);
        }
      }

      .delete-button-wrapper {
        display: block;
      }
    }

    &.token-row--confirm-open {
      .delete-button-wrapper {
        display: block;
      }
    }

    .delete-button-wrapper {
      display: none;
    }

    .token-info {
      flex: 1;
      min-width: 0;

      .token-name {
        font-size: 1.3rem;
        font-weight: 600;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        margin-bottom: 0.5rem;
      }

      .token-permission {
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
        margin-top: 0.2rem;
      }
    }
  }
`;
