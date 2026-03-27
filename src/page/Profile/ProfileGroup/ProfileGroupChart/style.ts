import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  flex: 1 1 auto;
  display: flex;
  align-items: center;

  & > div {
    width: 100%;
  }

  rect {
    fill: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
  }

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 5rem 0;
  }
`;

export { Wrapper };
