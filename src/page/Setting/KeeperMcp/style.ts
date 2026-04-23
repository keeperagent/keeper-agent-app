import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ModalMcpTokenCreatedWrapper = styled.div`
  padding-top: 1.6rem;

  .plain-token-label {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    margin-bottom: 0.8rem;
  }

  .plain-token-value {
    font-size: 1.2rem;
    font-weight: 500;
    word-break: break-all;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    padding: 0.8rem 1rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    border-radius: 0.4rem;
    margin-bottom: 1.2rem;
  }
`;

export const KeeperMcpWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  .section-label {
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    margin-bottom: 1rem;
  }

  .server-card {
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    border-radius: 0.8rem;
    overflow: hidden;
    margin-bottom: 2rem;

    .card-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.2rem 1.6rem;

      & + .card-row {
        border-top: 1px solid
          ${({ theme }: { theme: ITheme }) => theme.colorBorder};
      }

      .row-label {
        font-size: 1.2rem;
        font-weight: 500;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      }

      .row-control {
        display: flex;
        align-items: center;
        gap: 1.2rem;
      }

      .port-input {
        width: 12rem;
      }
    }
  }

  .cli-section {
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    border-radius: 0.8rem;
    padding: 1.4rem 1.6rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;

    .cli-text {
      .cli-title {
        font-size: 1.2rem;
        font-weight: 500;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        margin-bottom: 0.4rem;
      }

      .cli-desc {
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      }
    }

    .cli-button {
      flex-shrink: 0;
    }
  }

  .config-section {
    margin-bottom: 2rem;

    .code-wrapper {
      position: relative;
      margin-top: 1rem;

      .icon {
        position: absolute;
        bottom: 0.6rem;
        right: 0.6rem;
        width: 1.6rem;
        height: 1.6rem;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        border-radius: 0.3rem;

        svg {
          width: 1.4rem;
          height: 1.4rem;
        }

        &.copied svg {
          fill: var(--color-success);
        }
      }
    }
  }
`;
