import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ColumnWrapper = styled.div<{
  isDragOver?: boolean;
  isInvalidTarget?: boolean;
}>`
  min-width: 0;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid
    ${(props) =>
      props.isDragOver ? props.theme.colorPrimary : props.theme.colorBorder};
  box-shadow: ${(props) =>
    props.isDragOver ? `0 0 0 3px ${props.theme.colorPrimary}25` : "none"};
  opacity: ${(props) => (props.isInvalidTarget ? 0.4 : 1)};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 0.8rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgTag};
    flex-shrink: 0;
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  }

  .column-title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .column-title {
    font-weight: 600;
    font-size: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .column-header-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .column-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2.4rem;
    border-radius: 0.4rem;
    cursor: pointer;
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    transition:
      background 0.15s ease,
      color 0.15s ease;

    &:hover {
      background: ${({ theme }: { theme: ITheme }) => theme.colorBgNested};
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }
  }

  .column-count {
    background: color-mix(
      in srgb,
      var(--status-color, #94a3b8) 15%,
      transparent
    );
    color: var(--status-color, #94a3b8);
    border-radius: 0.5rem;
    padding: 0.2rem 0.8rem;
    font-size: 1.1rem;
    font-weight: 700;
    display: flex;
  }

  .column-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    opacity: 0.5;
    padding: 2rem 1rem;
    text-align: center;
  }

  .column-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    &::-webkit-scrollbar {
      width: 0.4rem;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ theme }: { theme: ITheme }) =>
        theme.scrollBarThumbColor};
      border-radius: 10rem;
    }
  }
`;
