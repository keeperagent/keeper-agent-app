import styled from "styled-components";
import { ITheme } from "@/style/theme";

const WalletActivityViewWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 1.6rem;
  overflow: hidden;

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--margin-right);
    flex-shrink: 0;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 30rem;

    & * {
      font-size: 1.3rem;
    }

    svg {
      width: 7rem;
    }
  }

  .hash-text {
    font-size: 1.2rem;
    font-family: monospace;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
    width: fit-content;
  }

  .hash-text.link {
    cursor: pointer;

    &:hover {
      color: ${(props: { theme: ITheme }) => props.theme.colorPrimary};
    }
  }

  .hash-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-family: monospace;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
    width: fit-content;

    .chain-icon {
      width: 1.4rem;
      height: 1.4rem;
    }
  }

  .hash-line.link {
    cursor: pointer;

    &:hover {
      color: ${(props: { theme: ITheme }) => props.theme.colorPrimary};
    }
  }

  .time-cell {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .time {
      font-size: 1.3rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
    }
  }

  .action-cell {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .action-label {
      font-size: 1.3rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
      font-weight: 500;
    }

    .protocol-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};

      .protocol-icon {
        width: 1.3rem;
        height: 1.3rem;
        border-radius: 50%;
      }
    }
  }

  .token-cell {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .token-line {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      font-size: 1.3rem;
      font-variant-numeric: tabular-nums;
    }

    .amount.negative {
      color: #e5484d;
    }

    .amount.positive {
      color: #3ba55d;
    }

    .usd-value {
      font-size: 1.2rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
    }
  }
`;

const PortfolioAppWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .text {
    font-size: 1.2rem;
  }
`;

export { WalletActivityViewWrapper, PortfolioAppWrapper };
