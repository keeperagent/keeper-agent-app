import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const pulseRing = keyframes`
  0%   { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.6); opacity: 0; }
`;

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;

  .dot {
    position: relative;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #22c55e;
      animation: ${pulseRing} 2s ease-out infinite;
    }
  }

  .text {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
  }
`;
