import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.6rem;
  padding: 1.2rem 1.6rem;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: var(--border-radius);
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};

  &.disabled {
    opacity: 0.5;
  }

  .tool-info {
    flex: 1;
    min-width: 0;
  }

  .tool-name {
    font-size: 1.3rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    margin-bottom: 0.5rem;
  }

  .tool-description {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    line-height: 1.5;
  }
`;
