import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .label {
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

    span {
      font-weight: 600;
      font-size: 1.5rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }

  .list-profile {
    overflow-y: hidden;

    &.long {
      overflow-y: auto;
      height: 50vh;
    }
  }
`;

export { Wrapper };
