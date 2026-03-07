import styled, { keyframes } from "styled-components";

const legoDrop = keyframes`
  0%   { transform: translateY(-40px); opacity: 0; }
  60%  { transform: translateY(2px);   opacity: 1; }
  80%  { transform: translateY(-3px); }
  100% { transform: translateY(0);     opacity: 1; }
`;

const legoPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(139, 92, 246, 0); }
  50%       { box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); }
`;

const loadingDots = keyframes`
  0%,  20% { content: ''; }
  40%       { content: '.'; }
  60%       { content: '..'; }
  80%, 100% { content: '...'; }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24px;
  background-color: #141414;
`;

export const LegoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
`;

export const LegoBlock = styled.div<{ $color: string; $delay: string }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  position: relative;
  opacity: 0;
  background: ${({ $color }) => $color};
  animation:
    ${legoDrop} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${({ $delay }) => $delay}
      forwards,
    ${legoPulse} 2s ease-in-out ${({ $delay }) => $delay} infinite;

  &::before {
    content: "";
    position: absolute;
    top: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: inherit;
    filter: brightness(1.3);
    box-shadow: inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  }
`;

export const LoadingText = styled.span`
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;

  &::after {
    content: "";
    animation: ${loadingDots} 1.5s steps(1) infinite;
  }
`;
