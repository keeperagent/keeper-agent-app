import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  position: relative;
  min-width: 50rem;

  &:not(:last-of-type) {
    margin-bottom: 1rem;
  }

  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  padding: 0.7rem 1.3rem;
  border-radius: var(--border-radius);
  border: 1px solid transparent;

  &:hover {
    background-color: var(--color-bg-primary);
    border: 1px dashed var(--color-primary);
  }

  .analyze-variable {
    position: absolute;
    top: 0.5rem;
    right: 1rem;
    font-size: 1.1rem;
    border-bottom: 1px dashed var(--color-primary);
    cursor: pointer;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-weight: 500;

    &:hover {
      color: var(--color-text-hover);
    }
  }

  .item {
    display: flex;
    align-items: center;

    &:not(:last-of-type) {
      margin-bottom: 0.3rem;
    }

    .label {
      font-size: 1rem;
      font-weight: 500;
      margin-right: 0.5rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .value {
      font-size: 1.1rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

export { Wrapper };
