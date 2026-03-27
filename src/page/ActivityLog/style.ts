import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  font-size: 1.6rem;
  overflow: hidden;
  padding: 2rem 2.4rem;

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
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
      width: 2rem;
      height: 2rem;
      min-width: 2rem;
      min-height: 2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    &:hover svg {
      fill: var(--color-primary);
    }
  }
`;

const DetailsCellWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;

  .primary {
    font-size: 1.3rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .secondary {
    font-size: 1.15rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.mono {
      font-family: monospace;
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

export { PageWrapper, DetailsCellWrapper, ResultTooltip };
