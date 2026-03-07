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
`;

const ListValueWrapper = styled.div`
  margin-bottom: var(--margin-bottom);
  margin-top: var(--margin-top);
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .title {
    margin-bottom: 1rem;
    font-size: 1.4rem;
    font-weight: 400;
  }

  .item {
    display: flex;
    width: 100%;

    &:not(:last-of-type) {
      margin-bottom: 0.5rem;
    }

    .icon {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin-top: 0.6rem;
      margin-left: 1.5rem;
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
  }

  .plus {
    align-self: center;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.5rem;
    cursor: pointer;

    &:hover {
      svg {
        fill: var(--color-primary);
      }
    }

    svg {
      width: 2.3rem;
      height: 2.3rem;
      min-width: 2.3rem;
      min-height: 2.3rem;
    }
  }
`;

export { Wrapper, ListValueWrapper };
