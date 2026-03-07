import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ColumnWrapper = styled.div`
  border-radius: 1rem;
  border: 2px dashed
    ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  padding: 4rem 1.5rem 3rem 1.5rem;
  position: relative;
  width: 25rem;
  margin-right: 0.5rem;
  margin-left: 0.5rem;

  &:hover {
    border: 2px dashed
      ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  &.active {
    border: 2px dashed var(--color-primary);
  }

  .heading {
    position: absolute;
    left: 1.2rem;
    top: 1rem;
    right: 0;

    .col-label {
      margin-right: auto;

      & * {
        color: white;
      }
    }

    .tool {
      display: flex;

      .icon {
        margin-left: 1rem;
        cursor: pointer;

        &.valid-attribute {
          svg {
            fill: ${({ theme }: { theme: ITheme }) => theme?.colorPrimaryLight};
          }
        }

        &.delete:hover {
          svg {
            fill: var(--color-error);
          }
        }

        &.delete {
          margin-left: 1rem;
        }

        svg {
          width: 1.3rem;
          height: 1.3rem;
          min-width: 1.3rem;
          min-height: 1.3rem;
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        }
      }
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
