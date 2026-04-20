import styled from "styled-components";

export const ChartResultWrapper = styled.div<{ $isLightMode: boolean }>`
  margin-top: 8px;
  width: 100%;
  background: ${({ $isLightMode }) =>
    $isLightMode ? "rgba(99, 102, 241, 0.05)" : "#13111c"};
  border-radius: 16px;
  padding: 20px 16px 12px;
  border: 1px solid
    ${({ $isLightMode }) => ($isLightMode ? "var(--color-border)" : "#251a2a")};
`;
