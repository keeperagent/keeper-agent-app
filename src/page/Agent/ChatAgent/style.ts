import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  height: 87vh;
  max-height: 87vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.6rem;
  overflow-x: hidden;

  .main {
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: flex;
    align-items: stretch;
    gap: 1.5rem;
    flex: 1 1 auto;
    position: relative;
    transition: cursor 0.2s ease;
    overflow: hidden;

    .left-wrapper {
      flex: 0 0 auto;
      min-width: 20rem;
      display: flex;
      flex-direction: column;

      .chart-wrapper {
        height: 100%;
      }
    }

    .right-wrapper {
      min-width: 20rem;
      border-radius: var(--border-radius);
      margin-left: 0.3rem;
      display: flex;
      flex-direction: column;

      .agent-view-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }

    .resizer {
      flex: 0 0 0.1rem;
      cursor: col-resize;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      position: relative;

      &::before {
        content: "‹";
        position: absolute;
        left: -1rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 2rem;
        color: inherit;
      }

      &::after {
        content: "›";
        position: absolute;
        right: -1rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 2rem;
        color: inherit;
      }
    }

    .resizer:hover,
    &.dragging .resizer {
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorTextSecondary};
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    &.only-chat {
      gap: 0;

      .right-wrapper {
        margin-left: 0;
      }
    }
  }
`;

export { PageWrapper };
