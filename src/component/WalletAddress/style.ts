import styled from "styled-components";
import { ITheme } from "@/style/theme";

const WalletAddressWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-right: 1rem;
  width: 100%;

  .text {
    margin-right: auto;
    width: 90%;

    & * {
      word-wrap: break-word;
    }
  }

  .list-icon {
    display: flex;
    justify-content: flex-end !important;
    margin-right: 1rem;

    .icon {
      height: 1.5rem;
      width: 1.5rem;
      margin-left: 1.5rem;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      &.copied {
        animation: slideDown 0.3s ease-in-out;

        svg {
          fill: var(--color-success);
        }

        &:hover {
          svg {
            fill: var(--color-success);
          }
        }
      }

      &:hover {
        svg {
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
      }

      svg {
        height: 1.5rem;
        width: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;
      }
    }
  }
`;

const QRCodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 0;
  align-items: center;

  .address {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    font-size: 1.3rem;
    display: flex;
    flex-direction: column;
    font-weight: 500;

    .label {
      font-weight: 400;
      font-size: 1.2rem;
    }
  }
`;

export { WalletAddressWrapper, QRCodeWrapper };
