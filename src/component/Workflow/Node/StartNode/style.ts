import styled from "styled-components";

const Wrapper = styled.div`
  background-color: var(--color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--box-shadow);
  position: relative;
  height: 4rem;
  width: 4rem;

  &:hover {
    .handle-area {
      visibility: visible;
    }
  }

  .text {
    color: var(--color-white);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .handle-area {
    position: absolute;
    width: 30%;
    height: 30%;
    background: transparent;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;

    .icon {
      width: 1.5rem;
      height: 1.5rem;

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
`;

export { Wrapper };
