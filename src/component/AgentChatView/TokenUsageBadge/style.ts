import styled from "styled-components";

const TokenUsageBadgeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  margin-right: auto;

  .usage-item {
    cursor: default;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .usage-separator {
    opacity: 0.7;
    user-select: none;
  }
`;

export { TokenUsageBadgeWrapper };
