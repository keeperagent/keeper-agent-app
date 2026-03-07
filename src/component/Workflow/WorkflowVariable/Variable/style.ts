import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  &:not(:last-of-type) {
    margin-bottom: 0.5rem;
  }

  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  padding: 0.5rem 1.3rem;
  cursor: pointer;
  border-radius: var(--border-radius);
  border: 1px solid transparent;

  &:hover,
  &.active {
    background-color: var(--color-bg-primary);
    border: 1px dashed var(--color-primary);
  }

  .label {
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .variable {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    display: flex;
    align-items: center;
    justify-content: space-between;

    .icon {
      height: 1.1rem;
      width: 1.1rem;
      cursor: pointer;
      margin-left: var(--margin-left);
      margin-top: -0.5rem;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        height: 1.1rem;
        width: 1.1rem;
        min-width: 1.1rem;
        min-height: 1.1rem;
      }
    }
  }
`;

export { Wrapper };
