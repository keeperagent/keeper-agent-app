import { ITheme } from "@/style/theme";
import styled from "styled-components";

const ListWrapper = styled.div`
  .add {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: var(--margin-top);
    margin-bottom: var(--margin-bottom);

    .icon {
      border: 1px dashed
        ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem;
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
`;

const ItemWrapper = styled.div`
  &:not(:last-of-type) {
    margin-bottom: var(--margin-bottom);
  }

  .input-item {
    .label {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      font-size: 1.1rem;

      & > span {
        margin-right: 1rem;
      }

      .remove-icon {
        align-self: center;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-left: auto;

        &:hover {
          svg {
            fill: var(--color-primary);
          }
        }

        svg {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          min-height: 1.5rem;
        }
      }
    }

    .input-wrapper * {
      margin-top: 0.5rem;
      font-size: 1.1rem !important;
    }
  }
`;

export { ListWrapper, ItemWrapper };
