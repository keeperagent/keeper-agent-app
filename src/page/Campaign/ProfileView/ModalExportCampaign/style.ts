import styled from "styled-components";

const ModalWrapper = styled.div`
  margin-top: var(--margin-top);
  margin-bottom: var(--margin-bottom-large);
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 3rem;
  padding: 0;

  &:hover {
    svg {
      stroke: var(--color-primary);
    }
  }

  svg {
    height: 1.3rem;
    width: 1.3rem;
    min-width: 1.3rem;
    min-height: 1.3rem;
  }
`;

export { ModalWrapper, IconWrapper };
