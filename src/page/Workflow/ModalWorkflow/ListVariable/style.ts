import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-bottom: 2rem;
  margin-top: var(--margin-top);
  max-height: 70rem;
  padding: 0 0.5rem;

  .add {
    display: flex;
    justify-content: center;
    align-items: center;

    .icon {
      border: 1px dashed
        ${({ theme }: { theme: ITheme; }) => theme?.colorTextSecondary};
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      border-radius: 0.5rem;
      cursor: pointer;

      &:hover {
        border: 1px dashed
          ${({ theme }: { theme: ITheme; }) => theme?.colorTextPrimary};

        svg {
          fill: ${({ theme }: { theme: ITheme; }) => theme?.colorTextPrimary};
        }
      }

      svg {
        height: 1rem;
        width: 1rem;
        min-width: 1rem;
        min-height: 1rem;
        fill: ${({ theme }: { theme: ITheme; }) => theme?.colorTextSecondary};
      }
    }
  }
`;

export { Wrapper };
