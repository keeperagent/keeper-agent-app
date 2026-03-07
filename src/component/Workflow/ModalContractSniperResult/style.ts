import styled from "styled-components";

const Wrapper = styled.div`
  .heading {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom-large);
    margin-top: var(--margin-top-large);
  }

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
