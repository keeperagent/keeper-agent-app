import styled from "styled-components";

const ModalWrapper = styled.div`
  margin-top: var(--margin-top);
  margin-bottom: var(--margin-bottom);

  .mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 47%;
    }
  }
`;

const HelpWrapper = styled.div`
  font-size: 1.1rem;

  .title {
    font-weight: 500;
  }
`;

export { ModalWrapper, HelpWrapper };
