import styled from "styled-components";
import { ITheme } from "@/style/theme";

const POSITIVE_COLOR = "#3ba55d";
const NEGATIVE_COLOR = "#e5484d";

const Wrapper = styled.div`
  .replay-header {
    padding-bottom: 1.6rem;
    margin-bottom: 1.6rem;
    border-bottom: 1px solid
      ${(props: { theme: ITheme }) => props.theme.colorBorderSubtle};
  }

  .replay-header .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.2rem;
  }

  .replay-header .meta-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .replay-header .meta-chip {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem 1.1rem;
    border-radius: 999px;
    border: 1px solid ${(props: { theme: ITheme }) => props.theme.colorBorder};
  }

  .replay-header .meta-label {
    font-size: 1rem;
    font-weight: 600;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
  }

  .replay-header .meta-value {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 1.2rem;
    font-family: monospace;
    font-weight: 600;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};

    &:hover {
      color: ${(props: { theme: ITheme }) => props.theme.colorPrimary};
    }
  }

  .replay-header .view-mode-toggle {
    margin-left: 0.4rem;
  }

  .replay-header .total-pnl {
    text-align: right;
  }

  .replay-header .total-pnl .label {
    font-size: 1.1rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
  }

  .replay-header .total-pnl .value {
    font-size: 2.6rem;
    font-weight: 700;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .replay-header .total-pnl .value.positive {
    color: ${POSITIVE_COLOR};
  }

  .replay-header .total-pnl .value.negative {
    color: ${NEGATIVE_COLOR};
  }

  .chart-container {
    height: 40rem;
    width: 100%;
    box-sizing: border-box;
    padding: 1.2rem;
    border-radius: 1.2rem;
    background: ${(props: { theme: ITheme }) => props.theme.colorBgWorkflow};
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-top: 1.2rem;
    padding: 0.8rem 1.2rem;
    border-radius: 1.2rem;
    background: ${(props: { theme: ITheme }) =>
      props.theme.colorBgTransparentLight};
  }

  .controls .play-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    cursor: pointer;
    background: ${(props: { theme: ITheme }) => props.theme.colorBgTransparent};
  }

  .controls .play-toggle:hover {
    background: ${(props: { theme: ITheme }) =>
      props.theme.colorBgTransparentLight};
  }

  .controls .scrubber {
    flex: 1;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
    margin-top: 1.6rem;
  }

  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stats-grid .stat {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .stats-grid .stat .label {
    font-size: 1.1rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
  }

  .stats-grid .stat .value {
    font-size: 1.4rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextPrimary};
  }

  .stats-grid .stat .value.positive {
    color: ${POSITIVE_COLOR};
  }

  .stats-grid .stat .value.negative {
    color: ${NEGATIVE_COLOR};
  }

  .caveat {
    margin-top: 1.2rem;
    font-size: 1.1rem;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
  }

  .empty-state {
    padding: 6rem 0;
    text-align: center;
    color: ${(props: { theme: ITheme }) => props.theme.colorTextSecondary};
  }
`;

export { Wrapper, POSITIVE_COLOR, NEGATIVE_COLOR };
