import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .button {
    display: flex;
    align-items: center;
    padding: 0.3rem 0.7rem;
    border-radius: 0.5rem;
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};

    .text {
      font-size: 0.9rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    .icon {
      width: 1.3rem;
      height: 1.3rem;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        width: 1.3rem;
        height: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
      }
    }
  }
`;

const ListVariableWrapper = styled.div`
  max-height: 50rem;
  padding: 0 0.5rem;
  overflow-y: auto;
`;

export { Wrapper, ListVariableWrapper };
