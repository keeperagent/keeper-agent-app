import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ColumnWrapper = styled.div`
  border-radius: 1rem;
  border: 2px dashed ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  padding: 4rem 1.5rem 3rem 1.5rem;
  position: relative;
  width: 23rem;
  margin-right: 0.5rem;
  margin-left: 0.5rem;

  &:hover {
    border: 2px dashed
      ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  &.active {
    border: 2px dashed var(--color-primary);
  }

  .col-label {
    position: absolute;
    left: 1.5rem;
    top: 1rem;

    & * {
      color: white;
    }
  }

  .is-valid {
    position: absolute;
    right: 1.5rem;
    top: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      height: 2rem;
      width: 2rem;
      min-width: 2rem;
      min-height: 2rem;
    }
  }

  .content {
    .label {
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      font-weight: 500;
    }
  }
`;

export { ColumnWrapper };
