import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  overflow-y: auto;

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

export const StatStrip = styled.div`
  display: flex;
  align-items: stretch;
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: 1rem;

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.6rem 1rem;
    gap: 0.6rem;

    & + .stat-item {
      border-left: 1px solid
        ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    }
  }

  .stat-value {
    font-size: 2.6rem;
    font-weight: 700;
    display: flex;
  }

  .stat-label {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 500;
  }
`;

export const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;

  .full-width {
    grid-column: 1 / -1;
  }
`;

export const ChartBox = styled.div`
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: 1rem;
  padding: 1.8rem 2rem;
  min-width: 0;
  overflow: hidden;

  .chart-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    margin-bottom: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 15rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    font-size: 1.3rem;
    opacity: 0.5;
  }
`;
