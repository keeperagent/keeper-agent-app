import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-right: var(--margin-right);
  display: flex;
  align-items: center;

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.7rem;
    cursor: pointer;
    transition: all 0.1s ease-in-out;

    svg {
      width: 1.2rem;
      height: 1.2rem;
      min-width: 1.2rem;
      min-height: 1.2rem;
    }

    &:hover {
      transform: rotate(45deg);
    }
  }

  .text {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    font-style: italic;
    font-weight: 500;
  }
`;

export { Wrapper };
