import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div<{ isDragging?: boolean }>`
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: 0.8rem;
  padding: 1.2rem;
  cursor: grab;
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }: { theme: ITheme }) => theme.colorPrimary};
    box-shadow: ${({ theme }: { theme: ITheme }) => theme.boxShadowNode};
  }

  .task-title {
    font-size: 1.4rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    line-height: 1.4;
    word-break: break-word;
  }

  .task-description {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .task-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .task-meta-primary {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .task-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .task-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem;
    border-radius: var(--border-radius);
    cursor: pointer;

    svg {
      width: 1.6rem;
      height: 1.6rem;
      min-width: 1.6rem;
      min-height: 1.6rem;
      fill: var(--color-error);
    }
  }

  &:hover .task-actions {
    opacity: 1;
  }

  .task-agent {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .task-due {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
  }
`;

export const PriorityBadge = styled.span<{ priority: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.7rem;
  border-radius: 10rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${(props) => {
    switch (props.priority) {
      case "URGENT":
        return "rgba(239, 68, 68, 0.15)";
      case "HIGH":
        return "rgba(249, 115, 22, 0.15)";
      case "MEDIUM":
        return "rgba(234, 179, 8, 0.15)";
      default:
        return "rgba(148, 163, 184, 0.15)";
    }
  }};
  color: ${(props) => {
    switch (props.priority) {
      case "URGENT":
        return "#ef4444";
      case "HIGH":
        return "#f97316";
      case "MEDIUM":
        return "#eab308";
      default:
        return "#94a3b8";
    }
  }};
`;
