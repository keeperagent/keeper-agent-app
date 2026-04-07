import styled from "styled-components";

const Wrapper = styled.div`
  margin-top: var(--margin-top);

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        width: 1.7rem;
        height: 1.7rem;
        min-width: 1.7rem;
        min-height: 1.7rem;
        cursor: pointer;
        padding: 0.2rem;

        &:hover {
          fill: var(--color-error);
        }
      }
    }
  }
`;

export { Wrapper };
