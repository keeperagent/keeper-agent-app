import styled from "styled-components";

const FormWrapper = styled.div`
  margin-top: -1.7rem;

  .list-column {
    margin-top: 2rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    overflow-x: scroll;
    padding: 0 0 2rem 0;

    & > * {
      flex-shrink: 0;
    }
  }

  .preview {
    display: flex;
    justify-content: space-between;
  }

  .help {
    margin-top: var(--margin-top);
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;

  .hint {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 0.3rem;
    transition: background 0.2s;

    &:hover {
      background: var(--color-border);
    }
  }
`;

const HelpWrapper = styled.div`
  font-size: 1.1rem;
  display: flex;
  align-items: center;

  .key {
    margin-left: 0.3rem;
    margin-right: 0.3rem;
    color: var(--color-error);
    font-weight: 500;
    background-color: var(--color-border);
    padding: 0.3rem 1rem;
    border-radius: 0.3rem;
    font-size: 1rem;
  }
`;

export { FormWrapper, HelpWrapper, PreviewHeader };
