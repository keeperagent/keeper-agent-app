import styled from "styled-components";

export const SystemPromptWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 1.2rem 1.6rem;
  gap: 1.2rem;

  .prompt-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .prompt-readonly-note {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .prompt-editor {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    & > div {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .cm-editor {
      height: 100%;
      border-radius: var(--border-radius);
    }

    .cm-scroller {
      overflow: auto;
    }
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }
`;
