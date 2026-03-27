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
    margin-bottom: var(--margin-bottom-large);
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    border-radius: 1rem;

    & > * + * {
      border-left: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    }
  }

  .chart {
    width: 100%;
    margin-bottom: 3rem;
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
