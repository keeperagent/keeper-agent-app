import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ContextBarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border-radius: var(--border-radius);
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
  flex-wrap: wrap;

  .context-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
    border-radius: 1.2rem;
    font-size: 1.1rem;
    cursor: pointer;
    white-space: nowrap;
    background: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTag || "rgba(0,0,0,0.06)"};
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    transition: all 0.15s ease;

    &:hover {
      border-color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
      color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
    }

    &.placeholder {
      opacity: 0.5;
      font-style: italic;
    }

    .chip-icon {
      width: 1.3rem;
      height: 1.3rem;
      border-radius: 50%;
      object-fit: contain;
      margin-right: 0.3rem;
    }

    .chip-label {
      max-width: 12rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .context-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.4rem;
      border-radius: 0.6rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTag || "rgba(0,0,0,0.06)"};
      }

      svg {
        width: 1.4rem;
        height: 1.4rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }
`;

const PresetPopoverWrapper = styled.div`
  min-width: 16rem;
  max-height: 35rem;
  overflow: auto;

  .ant-empty-image {
    height: 5rem;
  }

  .ant-empty-description {
    font-size: 1.1rem;
  }

  .preset-empty {
    svg {
      width: 5rem;
    }
  }

  .preset-item {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.5rem;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1.2rem;
    transition: background 0.15s ease;

    &:hover {
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTag || "rgba(0,0,0,0.06)"};
    }

    .preset-item-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

const DrawerSavePreset = styled.div`
  margin-top: 1.5rem;

  .preset-save-label {
    font-size: 1.2rem;
    opacity: 0.65;
    margin-bottom: 0.4rem;
  }

  .preset-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.6rem;

    > span {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius);
      font-size: 1.1rem;
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTag || "rgba(0,0,0,0.06)"};
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }

  .preset-save-row {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }
`;

const DrawerPresetSection = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  padding-top: 1.5rem;

  .preset-title {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .ant-empty-description {
    font-size: 1.3rem;
  }

  .preset-empty {
    margin-top: 3rem;

    svg {
      width: 9rem;
    }
  }
`;

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;
    margin-right: 1rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .content {
    display: flex;
    flex-direction: column;

    .name {
      font-size: 1.3rem;
      font-weight: 500;
      display: flex;
      align-items: center;
    }

    .description {
      font-size: 1rem;
      font-weight: 400;
      display: flex;
    }
  }
`;

export {
  ContextBarWrapper,
  PresetPopoverWrapper,
  DrawerSavePreset,
  DrawerPresetSection,
  OptionWrapper,
};
