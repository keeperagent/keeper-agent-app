import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PanelWrapper = styled.div`
  width: 23rem;
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;

  .heading {
    display: flex;
    padding: 1.5rem 1rem 0 1rem;

    .back {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      align-self: flex-start;

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

    .zoom-icon {
      cursor: pointer;
      margin-left: auto;

      &:hover {
        svg {
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
      }

      svg {
        height: 1.3rem;
        width: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }

    .setting {
      cursor: pointer;
      margin-left: var(--margin-left);

      span {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      &:hover {
        svg {
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
      }

      svg {
        height: 1.5rem;
        width: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }

  .search {
    padding: 1.5rem 1.5rem;
  }

  .list-node {
    padding: 0 1.5rem;
    height: 90%;
    overflow-y: auto;

    .group {
      &:not(:last-of-type) {
        margin-bottom: 3rem;
      }

      .label {
        font-size: 1.1rem;
        color: var(--color-text-secondary);
        margin-bottom: 1.3rem;
        font-weight: 500;
      }
    }
  }
`;

const NodeIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  &.large {
    img {
      width: 1.7rem;
      height: 1.7rem;
    }
  }

  img {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

export { PanelWrapper, NodeIconWrapper };
