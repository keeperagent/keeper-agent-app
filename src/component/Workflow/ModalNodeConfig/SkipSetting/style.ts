import styled from "styled-components";

const Wrapper = styled.div`
  margin-bottom: 2rem;

  .mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);
    margin-top: var(--margin-top);

    & > * {
      flex-basis: 47%;
    }
  }
`;

export { Wrapper };
