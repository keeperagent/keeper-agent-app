import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.6rem;
  overflow-y: auto;

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
      flex: 1;
      min-width: 20rem;
      min-height: 0;
      border-radius: var(--border-radius);
      margin-left: 0.3rem;
      display: flex;
      flex-direction: column;

      .agent-view-wrapper {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }

    .resizer {
      flex: 0 0 1px;
      cursor: col-resize;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      position: relative;
      transition: all 0.2s ease-in-out;

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
      box-shadow:
        0.5px 0 0 ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary},
        -0.5px 0 0
          ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
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
