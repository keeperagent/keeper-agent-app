import styled from "styled-components";

const Wrapper = styled.div`
  .mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 47%;
    }
  }
`;
export { Wrapper };
