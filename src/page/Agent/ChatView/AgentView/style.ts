import styled from "styled-components";

export const AgentPickerWrapper = styled.div`
  .picker-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 100%;
    overflow: hidden;
  }

  .picker-avatar {
    width: 1.6rem;
    height: 1.6rem;
    min-width: 1.6rem;
    border-radius: 50%;
    background: var(--color-primary);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .picker-name {
    font-size: 1.2rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
    transition: all 0.1s ease-in-out;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
