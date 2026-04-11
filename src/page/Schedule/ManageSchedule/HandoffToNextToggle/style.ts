import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;

  .label {
    font-size: 1.2rem;
  }

  .hint-icon {
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
      width: 1.3rem;
      height: 1.3rem;
      min-width: 1.3rem;
      min-height: 1.3rem;
    }
  }
`;

export { Wrapper };
