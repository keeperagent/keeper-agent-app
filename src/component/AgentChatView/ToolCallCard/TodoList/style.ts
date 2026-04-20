import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const Wrapper = styled.div<{ allComplete: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.4rem;
  padding: 0.5rem 0.7rem;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgNested};
  border: 1px solid
    ${({ theme }: { theme: ITheme }) => theme?.colorBorderSubtle};
  border-radius: 0.5rem;

  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 1.8rem;
  }

  .todo-status {
    flex: 0 0 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .spinner-sm {
    width: 1.3rem;
    height: 1.3rem;
    border: 1.5px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    border-top-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorPrimary || "#1677ff"};
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
  }

  .todo-check {
    color: var(--color-success, #52c41a);
    font-size: 1.5rem;
  }

  .todo-pending {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.4;
    font-size: 1.3rem;
    font-weight: 400;
  }

  .todo-error {
    color: var(--color-error, #ff4d4f);
  }

  .todo-content {
    flex: 1;
    font-size: 1.15rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    line-height: 1.4;
  }

  .todo-item--completed .todo-content {
    text-decoration: line-through;
    opacity: 0.55;
  }

  ${({ allComplete }) =>
    allComplete &&
    `
    .todo-item--completed .todo-content {
      text-decoration: none;
      opacity: 1;
    }
  `}

  .todo-item--in_progress .todo-content {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-weight: 500;
  }
`;
