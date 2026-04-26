import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: stretch;
  flex: 1 1 auto;
`;

const ChartFrame = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 48rem;
  flex: 1 1 auto;
  border: none;
  border-radius: 12px;
  background: transparent;
`;

export { Wrapper, ChartFrame };
