import styled from "styled-components";

const ModalWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-top: var(--margin-top);

  & > .mode {
    display: flex;
    justify-content: space-between;

    & > * {
      flex-basis: 32%;
    }
  }

  & > .content {
    height: 100%;
  }
`;

export { ModalWrapper };
