import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  position: relative;
  margin-right: -4rem;
  margin-left: -2rem;

  & > div {
    width: 100%;
    z-index: 1;
  }

  .total {
    display: flex;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: -1rem;
    z-index: 2;
    position: absolute;
    margin-left: 1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};

    .label {
      margin-right: 0.3rem;
    }

    .value {
      display: flex;
      align-items: center;

      .unit {
        margin-left: 0.3rem;
        margin-top: 1px;
      }
    }
  }

  rect {
    fill: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};
  }
`;

export { Wrapper };
