import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 1.4rem;
  box-sizing: border-box;
  gap: 1.6rem;
  padding: 0.9rem 1.6rem 1.6rem 1.6rem;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding-top: 1.6rem;
    gap: 1.2rem;
  }

  .header-filters {
    display: flex;
    align-items: center;
    gap: var(--margin-right);

    .filter-select {
      width: 20rem;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-shrink: 0;
  }

  .board {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(24rem, 1fr));
    gap: 1.2rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.6rem;

    &::-webkit-scrollbar {
      height: 0.5rem;
    }

    &::-webkit-scrollbar-track {
      background: ${({ theme }: { theme: ITheme }) =>
        theme.scrollBarTrackColor};
      border-radius: 10rem;
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ theme }: { theme: ITheme }) =>
        theme.scrollBarThumbColor};
      border-radius: 10rem;
    }
  }
`;

export const OptionWrapper = styled.div`
  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-size: 1.1rem;
    font-weight: 300;
  }
`;

export const KanbanColumn = styled.div<{
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

  .column-status-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(
      --status-color,
      ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary}
    );
    flex-shrink: 0;
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
