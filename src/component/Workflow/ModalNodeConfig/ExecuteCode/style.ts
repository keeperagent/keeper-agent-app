import styled from "styled-components";

const Wrapper = styled.div`
  .code-editor {
    border-radius: var(--border-radius);
    overflow: hidden;
  }

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
