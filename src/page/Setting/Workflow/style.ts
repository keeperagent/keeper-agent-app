import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  width: 100%;

  .heading {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--margin-right);
    margin-bottom: 1.6rem;
  }

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 1.7rem;

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      cursor: pointer;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }
`;

export { Wrapper };
