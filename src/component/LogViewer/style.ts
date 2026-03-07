import styled from "styled-components";
import {
  collapsedSidebarWidth,
  sidebarWidth,
} from "@/component/DashboardLayout/style";

interface LogViewerProps {
  isSidebarOpen: boolean;
  isFullScreen: boolean;
}

const LogViewerWrapper = styled.div<LogViewerProps>`
  position: fixed;
  bottom: 0;
  right: 0;
  left: ${(p) => (p.isSidebarOpen ? sidebarWidth : collapsedSidebarWidth)};
  height: ${(p) => (p.isFullScreen ? "100vh" : "39rem")};
  transition: height 0.3s ease;
  z-index: 999;

  display: flex;
  flex-direction: column;
  background: rgba(12, 12, 12, 0.85);
  backdrop-filter: blur(5px);
  border-top: 1px solid #1e1e1e;
  font-size: 1.3rem;
  color: var(--color-text-secondary);

  .log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 3.5rem;
    padding: 0.5rem 1.7rem;
    background: rgba(17, 17, 17, 0.95);
    border-bottom: 1px solid #1e1e1e;
    overflow: hidden;
  }

  .log-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--color-brown);
    text-transform: uppercase;
  }

  .log-header-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .log-filter-toggle {
    display: inline-flex;
    align-items: center;
    margin-right: 0.25rem;
  }

  .header-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    cursor: pointer;

    &:hover {
      background: var(--background-pink);
    }

    &.active {
      background: var(--color-bg-primary);

      svg {
        fill: var(--color-brown);
      }

      &:hover {
        background: var(--background-pink);
      }
    }

    svg {
      height: 1.6rem;
      width: 1.6rem;
      min-width: 1.6rem;
      min-height: 1.6rem;
      fill: var(--color-primary);
    }
  }

  .terminal-wrapper {
    position: relative;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    padding: 0.5rem 0;

    .terminal-container {
      width: 100%;
      height: 100%;

      .xterm {
        height: 100%;
      }

      .xterm-viewport {
        background: transparent !important;
      }
    }
  }
`;

const TerminalIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: 2rem;
    width: 2rem;
    min-width: 2rem;
    min-height: 2rem;
    fill: white;
  }
`;

const SearchBarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.2rem;
  background: #161616;
  border-bottom: 1px solid #1e1e1e;
  flex-shrink: 0;

  .search-input {
    flex: 1;
    max-width: 35rem;
    background: transparent;
    border: none;
    border-bottom: none;
    outline: none;
    color: var(--color-text-secondary);
    font-size: 1.2rem;
    padding: 0.2rem 0.4rem;

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &:focus {
      border-color: transparent;
    }
  }

  .search-count {
    flex-shrink: 0;
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    padding: 0 0.4rem;
  }

  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--color-gray);
    color: var(--color-text-secondary);
    font-size: 1.3rem;
    width: 1.7rem;
    height: 1.7rem;
    margin-left: 0.4rem;
    cursor: pointer;
    border-radius: 50%;

    &:hover {
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      border-color: var(--color-gray);
    }
  }
`;

export { LogViewerWrapper, TerminalIconWrapper, SearchBarWrapper };
