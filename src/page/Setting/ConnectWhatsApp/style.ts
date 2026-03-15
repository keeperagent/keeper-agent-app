import styled from "styled-components";

const Wrapper = styled.div`
  margin-top: var(--margin-top);

  .status-wrapper {
    display: flex;
    margin-bottom: var(--margin-bottom-small);
  }

  .qr-container {
    display: flex;
    justify-content: center;
    margin: 16px 0;
  }

  .button {
    display: flex;
    justify-content: flex-end;
  }
`;

export { Wrapper };
