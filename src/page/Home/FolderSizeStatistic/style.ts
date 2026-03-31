import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-right: -4rem;
  margin-left: -2rem;

  .total {
    display: flex;
    font-size: 1.4rem;
    font-weight: 700;
    padding-left: 1rem;
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
