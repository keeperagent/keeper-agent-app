import styled from "styled-components";

const Wrapper = styled.div`
  .mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
    }
  }

  .help {
    margin-bottom: var(--margin-bottom);
  }

  .plus {
    align-self: center;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.5rem;

    svg {
      width: 2.3rem;
      height: 2.3rem;
      min-width: 2.3rem;
      min-height: 2.3rem;
      cursor: pointer;

      &:hover {
        fill: var(--color-primary);
      }
    }
  }

  .minus {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    margin-top: 1rem;
    cursor: pointer;

    &:hover {
      svg {
        fill: var(--color-primary);
      }
    }

    svg {
      width: 2rem;
      height: 2rem;
      min-width: 2rem;
      min-height: 2rem;
    }
  }
`;

export { Wrapper };
