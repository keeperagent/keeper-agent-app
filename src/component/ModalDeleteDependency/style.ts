import styled from "styled-components";

const Wrapper = styled.div`
  .title {
    margin-bottom: var(--margin-bottom);
    margin-top: 3rem;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-content: center;
  cursor: pointer;

  &:hover {
    svg {
      fill: var(--color-blue);
    }
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

export { Wrapper, IconWrapper };
