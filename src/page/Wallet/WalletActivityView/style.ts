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

  .activity-list {
    max-height: calc(100vh - 28rem);
    overflow-y: auto;
    overflow-x: auto;
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

  .activity-row {
    display: grid;
    grid-template-columns: 170px 220px 150px 1fr;
    align-items: center;
    gap: 1.6rem;
    padding: 1.4rem 0.8rem;
    min-width: 900px;
    border-bottom: 1px solid
      ${(props: { theme: ITheme }) => props.theme.colorTableBorder};
    transition: background-color 0.15s ease;

    &:hover {
      background: ${(props: { theme: ITheme }) => props.theme.colorBgNested};
    }
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .time-cell {
    .time {
      color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
    }

    .tx-hash {
      font-size: 1.3rem;
      font-family: monospace;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
    }

    .tx-hash.link {
      cursor: pointer;
      text-decoration: underline dotted;
      text-underline-offset: 0.2rem;
      width: fit-content;

      &:hover {
        color: ${(props: { theme: ITheme }) => props.theme.colorPrimary};
      }
    }
  }

  .action-cell {
    .action-label {
      color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
      font-weight: 500;
    }

    .protocol-label {
      font-size: 1.3rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
    }
  }

  .token-cell {
    .token-line {
      font-variant-numeric: tabular-nums;
    }

    .token-line.negative {
      color: #f5222d;
    }

    .token-line.positive {
      color: #52c41a;
    }
  }

  .pagination-wrap {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    padding-top: var(--margin-top);
  }
`;

export { WalletActivityViewWrapper };
