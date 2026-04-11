import styled from "styled-components";
import { ITheme } from "@/style/theme";

const CustomNodeWrapper = styled.div`
  width: 15rem;
  background-color: ${({ theme }: { theme: ITheme }) => theme.colorBgNode};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }: { theme: ITheme }) => theme.boxShadowNode};
  border: 1px solid transparent;
  position: relative;

  .node-handle {
    opacity: 0;
    position: absolute;
    inset: 0;
    transform: none;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .branch-handles {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    pointer-events: none;
    visibility: hidden;

    .branch-handle-item {
      position: absolute;
      right: -1rem;
      width: 1.6rem;
      height: 1.6rem;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: all;

      &.success {
        top: calc(25% - 0.8rem);
      }

      &.error {
        top: calc(65% - 0.8rem);
      }

      .icon {
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;

        svg {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          min-height: 1.5rem;
        }
      }

      .node-handle {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 0;
        transform: none;
        opacity: 0;
      }
    }
  }

  &.highlight {
    border: 1px solid var(--color-primary);
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme.colorBgSecondary};
  }

  &.active {
    border: 1px solid var(--color-primary);
    box-shadow: ${({ theme }: { theme: ITheme }) => theme.boxShadowNodeBold};
  }

  &:hover {
    .branch-handles {
      visibility: visible;
    }
  }

  .error {
    position: absolute;
    top: 0;
    right: 0;
    height: 1rem;
    width: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 1px;
    z-index: 2;

    svg {
      height: 5px;
      width: 5px;
      min-width: 5px;
      min-height: 5px;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
    width: 100%;

    .header {
      width: 100%;
      height: 100%;
      padding: 4px 3px 0 4px;
      display: flex;
      align-items: center;

      .button {
        margin-right: 5px;
        display: flex;
        align-items: center;
        flex-direction: column;

        .icon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          width: 10px;
          height: 10px;

          svg {
            width: 10px;
            height: 10px;
            min-width: 10px;
            min-height: 10px;
          }
        }

        .action {
          display: flex;
          margin-top: 2px;

          .node-action {
            margin: 0.1rem;
            height: 0.6rem;
            width: 0.6rem;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
      }

      .node {
        .node-name {
          font-size: 0.9rem;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
          font-weight: 600;
          margin-bottom: 1px;
        }

        .node-type {
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
          display: flex;
          align-items: flex-end;

          .text {
            font-size: 0.6rem;
          }

          .icon {
            width: 1rem;
            height: 0.9rem;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--color-border);
            margin-right: 0.3rem;
            border-radius: 1px;

            svg {
              width: 0.5rem;
              height: 0.5rem;
              min-width: 0.5rem;
              min-height: 0.5rem;
            }

            img {
              width: 0.6rem;
              height: 0.6rem;
            }
          }
        }
      }
    }

    .statistic {
      margin-top: auto;
      width: 100%;
      padding: 4px 0;
      display: flex;

      .col-1 {
        flex-basis: 70%;
      }

      .col-2 {
        flex-basis: 35%;
      }

      .item {
        display: flex;
        align-items: center;
        padding: 1px 4px;

        &:not(:last-of-type) {
          margin-bottom: 1px;
          background-color: ${({ theme }: { theme: ITheme }) =>
            theme.colorBorder};
        }

        .label {
          font-size: 0.7rem;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
          flex-basis: 50%;
        }

        .value {
          font-size: 0.7rem;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
          font-weight: 600;
        }
      }
    }
  }
`;

const TooltipWrapper = styled.div`
  .condition {
    text-transform: uppercase;
    font-size: 0.9rem;
    margin-bottom: 0.2rem;
    font-weight: 600;

    &.success {
      color: var(--color-success);
    }

    &.error {
      color: var(--color-error);
    }

    &.skip {
      color: var(--color-yellow);
    }
  }

  .text {
  }
`;

export { CustomNodeWrapper, TooltipWrapper };
