import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  border: 1px dashed
    ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  margin-bottom: var(--margin-bottom);
  position: relative;

  .tool {
    position: absolute;
    top: 1rem;
    right: 1.1rem;
    display: flex;

    .delete {
      cursor: pointer;

      &:hover {
        svg {
          fill: var(--color-error);
        }
      }

      svg {
        width: 1.5rem;
        height: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }
`;

export { Wrapper };
