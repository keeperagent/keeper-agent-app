import styled from "styled-components";

const ModalWrapper = styled.div`
  margin-top: var(--margin-top);
`;

const FormLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;

  .text {
    margin-right: 0.5rem;
  }
`;

export { ModalWrapper, FormLabelWrapper };
