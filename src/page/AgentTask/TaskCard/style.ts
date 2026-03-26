import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div<{ isDragging?: boolean }>`
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: 0.8rem;
  padding: 1.1rem 1.2rem;
  cursor: grab;
  opacity: ${(props) => (props.isDragging ? 0.35 : 1)};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition:
    box-shadow 0.2s ease,
    transform 0.15s ease;
  position: relative;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.09);
    transform: translateY(-1px);

    .task-title {
      color: var(--color-text-hover);
    }
  }

  .task-title {
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    line-height: 1.45;
    word-break: break-word;
    transition: all 0.1s ease;
  }

  .task-description {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    line-height: 1.5;
  }

  .task-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    min-width: 0;
    padding-top: 0.65rem;
    border-top: 1px solid
      color-mix(
        in srgb,
        ${({ theme }: { theme: ITheme }) => theme.colorBorder} 45%,
        transparent
      );
  }

  .task-meta-left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .task-meta-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    font-size: 1.1rem;

    .task-meta-line-icon {
      width: 1.2rem;
      height: 1.2rem;
      opacity: 0.6;
    }
  }

  .task-agent,
  .task-due {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-age {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    opacity: 0.7;
    letter-spacing: 0.02em;
  }

  .task-meta-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .task-source-badge,
  .task-priority-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 10rem;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .task-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.2rem 0.3rem;
    border-radius: 0.5rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .task-actions {
    opacity: 1;
  }

  .task-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 0.4rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    transition: background 0.15s ease;
    outline: none;

    svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    &:hover {
      background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
    }
  }

  .task-pin--active {
    color: var(--color-primary);

    svg {
      fill: var(--color-primary);
    }
  }
`;
