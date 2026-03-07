import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  border-radius: var(--border-radius);
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  padding: 2rem 1rem 0.5rem 1rem;
  position: relative;

  &.short {
    .list-attribute {
      overflow-x: hidden;
      padding: 0;
    }
  }

  &:not(:last-of-type) {
    margin-bottom: var(--margin-bottom);
  }

  .heading {
    position: absolute;
    left: 2rem;
    top: 1rem;
    right: 0rem;
    display: flex;
    align-items: center;

    .title {
      text-transform: uppercase;
      font-size: 1rem;
      font-weight: 500;
    }

    .tool {
      margin-left: auto;
      margin-right: 1.5rem;
      display: flex;

      .icon {
        cursor: pointer;

        &.delete:hover {
          svg {
            fill: var(--color-error);
          }
        }

        &.delete {
          margin-left: 1rem;
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
  }

  .list-attribute {
    margin-top: 2rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: flex-start;
    overflow-x: scroll;
    padding: 0 0 2rem 0;

    & > * {
      flex-shrink: 0;
    }

    .add {
      width: 9rem;
      display: flex;
      justify-content: center;
      align-items: center;

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
  }
`;

export { Wrapper };
