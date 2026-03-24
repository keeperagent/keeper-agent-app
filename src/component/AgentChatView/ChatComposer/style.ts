import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ChatComposerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  width: 100%;

  .input {
    width: 100%;
    min-height: 0;
  }

  .input.input-with-upload {
    flex: 1;
  }

  .input-with-upload {
    position: relative;
    display: flex;
    flex: 1;
    width: 100%;
    border-radius: var(--border-radius);
    background: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgInput || "#fff"};

    .textarea-with-inset.ant-input {
      padding: 1rem;
      border: none;
      background: transparent;
      resize: none;
      height: 100% !important;
      min-height: 8rem;
    }

    .upload-inside {
      position: absolute;
      top: auto;
      right: auto;
      bottom: 0.6rem;
      left: 0.6rem;
      pointer-events: auto;
    }

    .upload-inside .icon.add-files {
      padding: 0.5rem;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
    }

    .upload-inside .icon.add-files:hover {
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTag || "rgba(0,0,0,0.06)"};
    }

    .upload-inside .icon.add-files svg {
      fill: ${({ theme }: { theme: ITheme }) =>
        theme?.colorTextSecondary || "#666"};
      transition: all 0.1s ease-in-out;
    }

    .upload-inside .icon.add-files:hover svg {
      fill: var(--color-text-hover);
    }
  }

  .actions {
    width: 100%;
    display: flex;
    margin-top: var(--margin-top);

    .stop-button,
    .reset-button {
      margin-right: var(--margin-right);
    }

    .stop-button {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .send-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .paper-plane-icon {
      transform: rotate(-30deg);
      display: inline-block;
      transition: transform 0.2s ease;
    }

    .layout {
      display: flex;
      align-items: center;
      margin-right: auto;

      .icon {
        padding: 0.7rem;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 1.5rem;
        background-color: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTransparent};
        border-radius: var(--border-radius);
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};

        &:hover {
          svg {
            fill: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
          }
        }

        &.active {
          border: 1px solid
            ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
        }

        svg {
          width: 1.7rem;
          height: 1.7rem;
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
      }
    }

    .spacer {
      margin-right: auto;
    }
  }
`;
