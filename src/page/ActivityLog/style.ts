import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;
  margin-top: var(--margin-top);

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--margin-right);
    flex-shrink: 0;
  }

  .heading-title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-right: auto;
  }

  .setting {
    cursor: pointer;
    display: flex;
    align-items: center;

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    &:hover svg {
      fill: var(--color-primary);
    }
  }
`;

const ActorCellWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;

  .actor-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
  }

  .actor-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.2rem;
    font-weight: 500;
  }

  .log-type-tag {
    font-size: 1.1rem;
    align-self: flex-start;
    margin: 0;
  }
`;

const TimeCellWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;

  .time-created {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    white-space: nowrap;
  }

  .time-duration {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  }
`;

const DetailsCellWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;

  .primary {
    font-size: 1.2rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .secondary {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.mono {
      font-family: monospace;
      font-size: 1.05rem;
      letter-spacing: -0.02em;
    }
  }
`;

const ResultTooltip = styled.div`
  font-size: 1.3rem;
  line-height: 1.5;
  max-width: 48rem;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.6rem 0;
  }
  th,
  td {
    border: 1px solid var(--color-border);
    padding: 0.4rem 0.8rem;
    text-align: left;
  }
  p {
    margin: 0.4rem 0;
  }
  p:first-child {
    margin-top: 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
  a {
    color: var(--color-primary-light);
  }
`;

export {
  PageWrapper,
  ActorCellWrapper,
  TimeCellWrapper,
  DetailsCellWrapper,
  ResultTooltip,
};
