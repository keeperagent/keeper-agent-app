import styled from "styled-components";

export const ChatInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem 1.6rem;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;

  .encrypt-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .encrypt-label {
      font-size: 1.2rem;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  }

  .input-row {
    display: flex;
    gap: 0.8rem;
    align-items: flex-end;

    .ant-input {
      flex: 1;
      resize: none;
    }
  }
`;
