import styled from "styled-components";

const Wrapper = styled.div`
  .encript {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
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

export { Wrapper, OptionWrapper };
