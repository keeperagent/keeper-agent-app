import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .step {
    display: flex;
    gap: 1.2rem;
    margin-bottom: 1.8rem;
    position: relative;

    &:not(:last-child)::before {
      content: "";
      position: absolute;
      left: 1.15rem;
      top: 2.6rem;
      width: 1px;
      bottom: -1.8rem;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    }
  }

  .step-number {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgInput};
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 0.1rem;
    position: relative;
    z-index: 1;
  }

  .step-content {
    flex: 1;
    min-width: 0;

    .step-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
      line-height: 2.4rem;
    }

    .step-hint {
      font-size: 1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-bottom: 0.8rem;
    }

    .ant-form-item {
      margin-bottom: 0.8rem;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .agent-label {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;

    &.a {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimaryLight};
    }

    &.b {
      color: #f97316;
    }
  }

  .vs-divider {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin: 1rem 0;

    &::before,
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    }

    .vs-text {
      font-size: 1.1rem;
      font-weight: 800;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      letter-spacing: 0.12em;
    }
  }

  .rounds-wrapper {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.4rem;

    .round-dot {
      width: 2.8rem;
      height: 2.8rem;
      border-radius: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      background: transparent;
      transition: all 0.15s ease;
      user-select: none;

      &:hover {
        border-color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
        color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTransparentLight};
      }

      &.active {
        border-color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
        color: var(--color-white);
        background: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
        font-weight: 700;
      }
    }
  }
`;

export { Wrapper };
