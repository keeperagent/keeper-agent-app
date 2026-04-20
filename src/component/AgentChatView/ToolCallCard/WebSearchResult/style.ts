import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const WebSearchResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  max-height: 20rem;
  overflow-y: auto;
  border: 1px solid
    ${({ theme }: { theme: ITheme }) => theme?.colorBorderSubtle};
  border-radius: 0.5rem;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgNested};
  padding: 0.5rem 0.5rem;
`;

export const WebSearchResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.45rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.12s ease;
  overflow: hidden;

  &:hover {
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgWorkflow};

    .title {
      color: var(--color-text-hover);
    }
  }

  .favicon {
    width: 1.4rem;
    height: 1.4rem;
    flex: 0 0 1.4rem;
    border-radius: 3px;
    object-fit: contain;
  }

  .title {
    font-size: 1.15rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .extract-spinner {
    flex: 0 0 auto;
    width: 1rem;
    height: 1rem;
    border: 1.5px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    border-top-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorPrimary || "#1677ff"};
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
    margin-left: 0.4rem;
  }

  .extract-done {
    flex: 0 0 auto;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--color-success, #52c41a);
    margin-left: 0.4rem;
  }

  .domain {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    flex: 0 0 auto;
    white-space: nowrap;
    margin-left: 0.5rem;
    opacity: 0.6;
  }
`;
