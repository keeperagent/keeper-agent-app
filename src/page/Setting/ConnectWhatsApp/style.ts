import styled from "styled-components";

const Wrapper = styled.div`
  margin-top: var(--margin-top);

  .qr-container {
    display: flex;
    justify-content: center;
    margin: 16px 0;
  }

  .qr-container canvas {
    border-radius: 8px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 13px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .status-dot.connected {
    background-color: #52c41a;
  }

  .status-dot.disconnected {
    background-color: #ff4d4f;
  }

  .status-dot.connecting {
    background-color: #faad14;
  }

  .button {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
`;

export { Wrapper };
