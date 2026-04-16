import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .add {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 3rem;

    .icon {
      border: 1px dashed
        ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      border-radius: 0.5rem;
      cursor: pointer;

      &:hover {
        border: 1px dashed
          ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

        svg {
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
      }

      svg {
        height: 1rem;
        width: 1rem;
        min-width: 1rem;
        min-height: 1rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }

  .node-provider-option {
    display: flex;
    justify-content: space-between;
    margin-top: var(--margin-top);
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
    }
  }
`;

export { Wrapper };
