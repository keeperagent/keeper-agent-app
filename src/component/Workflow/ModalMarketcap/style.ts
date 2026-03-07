import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-top: 3rem;

  rect {
    fill: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
  }
`;

export { Wrapper };
