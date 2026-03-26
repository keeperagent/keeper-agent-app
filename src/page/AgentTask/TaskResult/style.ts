import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  border-radius: 0.8rem;
  overflow: hidden;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};

  .result-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgTag};
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    cursor: pointer;
    user-select: none;
  }

  .result-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--dot-color, #94a3b8);
  }

  .result-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
  }

  .result-chevron {
    width: 0.55rem;
    height: 0.55rem;
    border-right: 1.5px solid
      ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    border-bottom: 1.5px solid
      ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    transform: rotate(-45deg);
    margin-left: auto;
    flex-shrink: 0;
    transition: transform 0.2s ease;

    &.result-chevron--open {
      transform: rotate(45deg);
    }
  }

  .result-body {
    max-height: 15rem;
    overflow-y: auto;
    padding: 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};

    pre {
      margin: 0;
      font-size: 1.2rem;
      font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.6;
    }
  }
`;
