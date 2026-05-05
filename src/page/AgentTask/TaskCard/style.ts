import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const borderSpin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Wrapper = styled.div<{
  isDragging?: boolean;
  isFinished?: boolean;
}>`
  --card-bg: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
  background: var(--card-bg);
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: 0.8rem;
  padding: 1.1rem 1.2rem;
  cursor: ${(props) => (props.isFinished ? "default" : "grab")};
  opacity: ${(props) => (props.isDragging ? 0.35 : 1)};

  &.is-running {
    border-color: transparent;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: -100%;
      background: conic-gradient(
        from 0deg,
        transparent 0%,
        #3b82f6 15%,
        #93c5fd 30%,
        transparent 45%
      );
      animation: ${borderSpin} 3s linear infinite;
      z-index: 0;
    }

    &::after {
      content: "";
      position: absolute;
      inset: 2px;
      background: var(--card-bg);
      border-radius: 0.6rem;
      z-index: 1;
    }

    .task-title,
    .task-description,
    .task-meta {
      position: relative;
      z-index: 2;
    }

    .task-actions {
      z-index: 2;
    }
  }

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
      min-width: 1.2rem;
      border-radius: 50%;
      object-fit: cover;
      opacity: 0.8;
      flex-shrink: 0;
    }
  }

  .task-agent,
  .task-due {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-agent-link {
    cursor: pointer;
    border-radius: 0.4rem;
    padding: 0.1rem 0.3rem;
    margin: -0.1rem -0.3rem;
    transition: background 0.15s ease;

    &:hover {
      background: ${({ theme }: { theme: ITheme }) => theme.colorBgTag};

      .task-agent {
        color: var(--color-primary);
      }
    }
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
    padding: 0.5rem;
    border-radius: 0.4rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    transition: background 0.15s ease;
    outline: none;

    svg {
      width: 1.3rem;
      height: 1.3rem;
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
