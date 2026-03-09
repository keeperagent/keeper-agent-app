import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  cursor: pointer;
  border-radius: var(--border-radius);
  overflow: hidden;

  &:hover {
    border: 1px dashed var(--color-primary);

    .item-top-bar .item-name {
      color: var(--color-text-hover);
    }
  }

  .item-dots-row {
    display: flex;
    align-items: center;
    padding: 1rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgInputDisable};
  }

  .item-dots {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-dot {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .item-dot-red {
    background: #ff5f57;
  }

  .item-dot-yellow {
    background: #febc2e;
  }

  .item-dot-green {
    background: #28c840;
  }

  .item-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0rem 1.2rem 1rem 1.2rem;
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgInputDisable};

    .item-name {
      font-size: 1.4rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      transition: all 0.2s ease-in-out;
    }
  }

  .item-center {
    flex: 1;
    padding: 1rem 1.2rem;
    min-height: 5rem;
  }

  .item-center-row {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .item-label {
    display: block;
    font-size: 1.1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    margin-bottom: 0.2rem;
  }

  .item-value {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    line-height: 1.4;
  }

  .item-description {
    display: -webkit-box;
    -webkit-line-clamp: 7;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .item-bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0.8rem 1.2rem;
    min-height: 2.8rem;
    border-top: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgInputDisable};
  }

  .item-updated {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    .btn-delete {
      display: flex;

      svg {
        width: 1.4rem;
        height: 1.4rem;
        min-width: 1.4rem;
        min-height: 1.4rem;
        cursor: pointer;
      }

      .trash {
        &:hover {
          fill: var(--color-error);
        }
      }
    }
  }

  .item-action-open-folder {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 2px;

    .open-folder-icon {
      width: 1.5rem;
      height: 1.5rem;

      svg {
        width: 1.5rem;
        height: 1.5rem;
        max-width: 1.5rem;
        max-height: 1.5rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }

    &:hover .open-folder-icon svg {
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
    }
  }
`;
