import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const HistoryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 1.2rem 1.6rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .history-pagination {
    display: flex;
    justify-content: center;
    padding: 1.2rem 1.6rem;
    border-top: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    flex-shrink: 0;
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 4rem;
  }

  .empty-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 4rem;
  }
`;
