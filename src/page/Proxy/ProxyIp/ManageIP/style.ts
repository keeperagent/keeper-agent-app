import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .back {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-right: var(--margin-right);

      &:hover {
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

        .icon {
          svg {
            fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          }
        }
      }

      .icon {
        height: 2rem;
        width: 2rem;
        margin-right: 0.5rem;

        svg {
          height: 2rem;
          width: 2rem;
          min-width: 2rem;
          min-height: 2rem;
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        }
      }

      .text {
        font-size: 1.3rem;
        font-weight: 500;
      }
    }
  }

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 1.7rem;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: var(--margin-right);
    }

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      cursor: pointer;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
  }
`;

export { PageWrapper, OptionWrapper };
