import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  left: 1.5rem;
  position: absolute;
  display: flex;
  align-items: center;

  & > * {
    margin-right: 1rem;
  }

  .tool {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    left: 21.5rem;

    & > * {
      margin-right: 1rem;
    }

    .info {
      display: flex;
      flex-direction: column;
      background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      padding: 0.5rem 1.5rem;
      border-radius: var(--border-radius);
      margin-right: 2rem;
      width: auto;

      .label {
        margin-right: 0.5rem;
        font-size: 0.8rem;
        margin-bottom: 0rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        white-space: nowrap;
      }

      .value {
        font-weight: 600;
        font-size: 1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        white-space: nowrap;
      }
    }

    .refresh-icon {
      margin-right: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;

      &:hover {
        svg {
          fill: var(--color-text-hover);
        }
      }

      svg {
        height: 1.3rem;
        width: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }

    .undo-redo {
      display: flex;
      margin-left: 0.5rem;

      .item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.2rem 0.5rem;
        cursor: pointer;

        &.disable {
          cursor: not-allowed;
        }

        &:hover {
          .text {
            color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          }

          .icon {
            svg {
              fill: ${({ theme }: { theme: ITheme }) =>
                theme?.colorTextPrimary};
            }
          }
        }

        .icon {
          height: 2rem;
          width: 1rem;

          svg {
            height: 1rem;
            width: 1rem;
            min-width: 1rem;
            min-height: 1rem;
            fill: ${({ theme }: { theme: ITheme }) =>
              theme?.colorTextSecondary};
          }
        }

        .text {
          font-size: 0.9rem;
          font-weight: 400;
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
          display: flex;
          align-items: center;
          justify-content: center;

          .count {
            padding: 2px 5px;
            margin-left: 0.5rem;
            border-radius: 3px;
            background-color: ${({ theme }: { theme: ITheme }) =>
              theme?.colorBorder};
            color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
            font-size: 0.9rem;
          }
        }
      }
    }

    .hint {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
    }

    .encryptKey {
      display: flex;
      justify-content: center;
      align-items: center;

      & > * {
        transform: scale(0.8);
        margin-bottom: 0 !important;
      }

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: -0.7rem;

        svg {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          min-height: 1.5rem;
        }
      }
    }
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  cursor: pointer;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
    transition: all 0.1s ease-in-out;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
  }
`;
export { Wrapper, OptionWrapper };
