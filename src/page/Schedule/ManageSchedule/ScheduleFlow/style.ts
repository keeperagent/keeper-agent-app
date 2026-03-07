import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  display: flex;
  align-items: center;

  .connector {
    height: 2px;
    width: 7rem;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextSecondary};
    position: relative;

    &::after {
      position: absolute;
      right: -0.1rem;
      top: 50%;
      transform: translate(0, -50%);
      content: "";
      width: 0;
      height: 0;
      border-top: 0.7rem solid transparent;
      border-bottom: 0.7rem solid transparent;
      border-left: 1rem solid
        ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    &::before {
      position: absolute;
      left: -0.1rem;
      top: 50%;
      transform: translate(0, -50%);
      content: "";
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorTextSecondary};
    }
  }
`;

export { Wrapper };
