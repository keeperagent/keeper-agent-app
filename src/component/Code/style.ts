import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
  padding: 0.3rem 1rem;

  .content {
    color: var(--color-error);
    font-weight: 500;
    font-size: 1rem;
    border-radius: 0.5rem;
  }

  .icon {
    height: 1.1rem;
    width: 1.1rem;
    cursor: pointer;
    margin-left: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;

    &.copied {
      animation: slideDown 0.3s ease-in-out;

      svg {
        fill: var(--color-success);
      }

      &:hover {
        svg {
          fill: var(--color-success);
        }
      }
    }

    svg {
      height: 1.1rem;
      width: 1.1rem;
      min-width: 1.1rem;
      min-height: 1.1rem;
    }
  }
`;

export { Wrapper };
