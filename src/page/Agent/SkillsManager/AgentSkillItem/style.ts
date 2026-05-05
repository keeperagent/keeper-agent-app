import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: var(--border-radius);
  overflow: hidden;
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgCard};
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }: { theme: ITheme }) => theme.colorBorderHover};
  }

  .item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.2rem;
  }

  .item-dots {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-dot {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .item-dot-red {
    background: #ff5f57;
  }
  .item-dot-yellow {
    background: #febc2e;
  }
  .item-dot-green {
    background: #28c840;
  }

  .item-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0 1.2rem 1.2rem 1.2rem;
    cursor: pointer;
  }

  .item-name {
    font-size: 1.4rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    line-height: 1.4;
    transition: color 0.15s ease;
  }

  .item-description {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .item-footer {
    margin: 0 1.2rem;
    border-top: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    padding: 0.8rem 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .item-updated {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    opacity: 0.7;
    flex-shrink: 0;
  }

  .item-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.6rem;

    .ant-btn {
      text-transform: lowercase;
      font-size: 1.1rem !important;
    }
  }
`;
