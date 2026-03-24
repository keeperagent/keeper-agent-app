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

  .item-wrapper {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    margin-bottom: 1.2rem;
  }

  .port-row {
    display: flex;
    gap: 1rem;
    align-items: center;

    .port-input {
      width: 14rem;
    }
  }

  .status-wrapper {
    display: flex;
  }

  .connect-hint {
    .code-wrapper {
      position: relative;
      margin-top: 0.8rem;

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
