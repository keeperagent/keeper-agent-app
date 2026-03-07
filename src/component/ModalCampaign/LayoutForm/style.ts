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

export { Wrapper };
