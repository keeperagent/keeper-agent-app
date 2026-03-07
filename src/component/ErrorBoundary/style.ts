import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #141414;
  padding: 2rem;
  box-sizing: border-box;
  text-align: center;
  animation: ${fadeIn} 0.4s ease both;
`;

const BigNumber = styled.div`
  font-size: 10rem;
  font-weight: 800;
  line-height: 1;
  color: rgba(255, 255, 255, 0.06);
  letter-spacing: -0.02em;
  user-select: none;
  margin-bottom: 1rem;
`;

const Title = styled.div`
  font-size: 1.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.01em;
  margin-bottom: 0.75rem;
  font-family: var(--text-font-primary);
`;

const Description = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.08em;
  max-width: 400px;
  line-height: 1.7;
  margin-bottom: 2rem;
  word-break: break-word;
  font-family: var(--text-font-secondary);
`;

const RetryButton = styled.button`
  padding: 0.6rem 2rem;
  background-color: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;

  &:hover {
    background-color: #4338ca;
  }

  &:active {
    transform: scale(0.97);
  }
`;

export { Container, BigNumber, Title, Description, RetryButton };
