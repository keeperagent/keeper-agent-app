import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  height: calc(-10.5rem + 100vh);
  display: flex;
  font-size: 1.6rem;
  position: relative;

  .percentage {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 0.3rem;
    display: flex;
    z-index: 3;

    .current {
      background-color: var(--color-success);
      border-radius: 0.5px 0 0 0.5px;
      position: relative;
      transition: all 0.7s ease-in-out;

      .mark {
        position: absolute;
        right: 0rem;
        top: 50%;
        transform: translate(0, -50%);
        width: 1.1rem;
        height: 1.1rem;
        border-radius: 50%;
        cursor: pointer;
      }
    }

    .total {
      background-color: var(--background-success);
      transition: all 0.7s ease-in-out;
      border-radius: 0 0.5px 0.5px 0;
    }
  }

  .flow {
    flex: 1 1 auto;
    align-self: stretch;
    position: relative;
    overflow: hidden;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgWorkflow};

    .alignment-guides {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 5;
    }

    .alignment-guide {
      position: absolute;
      background-color: var(--color-primary);
    }

    .alignment-guide-vertical {
      top: 0;
      bottom: 0;
      width: 1px;
    }

    .alignment-guide-horizontal {
      left: 0;
      right: 0;
      height: 1px;
    }
  }
`;

const StatusWrapper = styled.div`
  display: flex;
  flex-direction: column;

  .item {
    display: flex;
    align-items: flex-start;
    font-size: 1.2rem;
    padding: 0.5rem 1rem;

    .label {
      white-space: nowrap;
      display: flex;
      align-items: center;

      .icon {
        border-radius: 0.2rem;
        width: 1rem;
        height: 1rem;
        margin-right: 1rem;
        flex-shrink: 0;
      }
    }

    .value {
      margin-left: 1rem;
      white-space: nowrap;
      font-weight: 600;
    }
  }
`;

export { PageWrapper, StatusWrapper };
