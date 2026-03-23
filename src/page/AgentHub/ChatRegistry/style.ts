import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .chat-header {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1rem 1.6rem;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;

    .btn-back {
      flex-shrink: 0;
    }

    .chat-agent-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chat-tabs {
      flex-shrink: 0;
      margin-bottom: 0;

      .ant-tabs-nav {
        margin-bottom: 0;
      }
    }
  }

  .chat-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }
`;
