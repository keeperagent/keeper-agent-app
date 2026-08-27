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

  .activity-table {
    .ant-table {
      background: transparent;
    }

    .ant-table-tbody > tr > td {
      padding: 1.2rem 1rem;
      border-bottom: 1px solid
        ${(props: { theme: ITheme }) => props.theme.colorBorderSubtle};
    }

    .ant-table-tbody > tr > td:first-child {
      padding-left: 0;
    }

    .ant-table-tbody > tr > td:last-child {
      padding-right: 0;
    }

    .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }

    .ant-table-tbody > tr > td.ant-table-cell-row-hover,
    .ant-table-tbody > tr:hover > td {
      background: ${(props: { theme: ITheme }) => props.theme.colorBgNested};
    }
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
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

  .time-cell {
    .time {
      font-size: 1.3rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
    }
  }

  .action-cell {
    .action-label {
      font-size: 1.3rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
      font-weight: 500;
    }

    .protocol-label {
      font-size: 1.2rem;
      color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
    }
  }

  .token-cell {
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

export { WalletActivityViewWrapper };
