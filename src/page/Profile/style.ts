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

  .tab {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }
`;

const ChartWrapper = styled.div`
  rect {
    fill: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
  }
`;

export { PageWrapper, ChartWrapper };
