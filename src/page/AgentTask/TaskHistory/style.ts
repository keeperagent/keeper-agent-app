import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  margin-top: 1.6rem;

  .history-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  .history-entry {
    display: flex;
    gap: 1rem;
  }

  .history-line-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 1rem;
    flex-shrink: 0;
  }

  .history-dot {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: var(--dot-color, #94a3b8);
    flex-shrink: 0;
    margin-top: 0.3rem;
  }

  .history-connector {
    width: 1px;
    flex: 1;
    min-height: 1rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    margin: 0.3rem 0;
  }

  .history-body {
    flex: 1;
    padding-bottom: 1.4rem;
  }

  .history-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .history-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
  }

  .history-actor {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
  }

  .history-time {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    opacity: 0.5;
    margin-left: auto;
  }

  .history-message {
    margin-top: 0.3rem;
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    opacity: 0.7;
    word-break: break-word;
  }
`;
