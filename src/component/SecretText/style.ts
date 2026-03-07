import styled from "styled-components";
import { ITheme } from "@/style/theme";

const SecretTextWrapper = styled.div`
  display: flex;
  align-items: center;

  .text {
    max-width: 60vw;
    margin-right: 3rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .icon {
    margin-right: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
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

    &:hover {
      svg {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }

    svg {
      height: 1.3rem;
      width: 1.3rem;
      min-width: 1.3rem;
      min-height: 1.3rem;
    }
  }
`;

export { SecretTextWrapper };
