import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;
  margin-top: var(--margin-top);

  .data-statistic {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom-large);
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
    padding: 2rem 2rem;
    border-radius: var(--border-radius);

    & > * {
      flex-basis: 24%;
    }
  }

  .chart {
    width: 100%;
    margin-top: var(--margin-top);
  }

  .file-statistic {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    margin-top: var(--margin-top-large);
  }
`;

export { Wrapper };
