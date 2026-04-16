import styled from "styled-components";

const Wrapper = styled.div`
  .condition {
    text-transform: uppercase;
    font-size: 0.9rem;
    margin-bottom: 0.2rem;
    font-weight: 600;

    &.success {
      color: var(--color-success);
    }

    &.error {
      color: var(--color-error);
    }
  }
`;

export { Wrapper };
