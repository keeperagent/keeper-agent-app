import styled from "styled-components";

export const MemoryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 1.2rem 1.6rem;
  gap: 1.2rem;

  .memory-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;

    .memory-title {
      font-size: 1.3rem;
      color: var(--color-text-secondary);
    }
  }

  .memory-editor {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .ant-input {
      flex: 1;
      height: 100%;
      resize: none;
      font-family: "Courier New", Courier, monospace;
      font-size: 1.2rem;
      line-height: 1.6;
    }
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }
`;
