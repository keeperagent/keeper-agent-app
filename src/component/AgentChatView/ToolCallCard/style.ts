import styled, { keyframes } from "styled-components";
import { ITheme } from "@/style/theme";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const ToolCallGroupWrapper = styled.div<{ expanded: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ expanded }) => (expanded ? "0.8rem" : "0.4rem")};

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    padding: 0.2rem 0;
    user-select: none;

    &:hover .summary-text {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    .group-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      margin-bottom: 0.7rem;

      .icon-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.5rem;
        height: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;

        svg {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          min-height: 1.5rem;
        }
      }
    }

    .summary-text {
      font-size: 1.15rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.15s ease;
    }
  }

  .group-content {
    display: grid;
    grid-template-rows: ${({ expanded }) => (expanded ? "1fr" : "0fr")};
    transition: grid-template-rows 0.5s ease;
  }

  .group-content-inner {
    overflow: hidden;
    min-height: 0;
  }

  .group-body {
    position: relative;
    display: flex;
    flex-direction: column;
    margin-left: 0.45rem;
    padding-left: 1.6rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    gap: 0.8rem;

    &::before {
      content: "";
      position: absolute;
      left: 0.5rem;
      top: 0;
      bottom: 0;
      width: 1px;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    }
  }

  .done-row,
  .thinking-row {
    position: relative;
    display: flex;
    align-items: center;
    margin-left: calc(0.45rem + 1.6rem);
    margin-top: 0.5rem;

    .done-icon {
      position: absolute;
      left: -1.7rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 1.2rem;
        height: 1.2rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }

    .done-label {
      font-size: 1.2rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-left: 0.3rem;
    }

    .thinking-icon {
      position: absolute;
      left: -1.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.2rem;
      height: 1.2rem;
    }

    .spinner-thinking {
      width: 1rem;
      height: 1rem;
      border: 1.5px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      border-top-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorPrimary || "#1677ff"};
      border-radius: 50%;
      animation: ${spin} 0.8s linear infinite;
    }

    .thinking-label {
      font-size: 1.2rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-left: 0.3rem;
    }
  }

`;
