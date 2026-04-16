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

export { Wrapper };
