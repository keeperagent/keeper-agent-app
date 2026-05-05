import styled from "styled-components";
import { ITheme } from "@/style/theme";
import { markdownStyles } from "@/style/markdown";

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

  .result-body {
    max-height: 25rem;
    overflow-y: auto;
    padding: 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};
    font-size: 1.35rem;
    line-height: 1.7rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    ${markdownStyles}
  }
`;
