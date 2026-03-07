import styled from "styled-components";

const Wrapper = styled.div`
  .mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);
    margin-top: -1rem;

    & > * {
      flex-basis: 47%;
    }
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;

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
