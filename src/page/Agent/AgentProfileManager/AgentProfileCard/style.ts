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
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgCard};
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }: { theme: ITheme }) => theme.colorBorderHover};

    .item-actions .item-icon-group,
    .item-actions .item-actions-separator {
      visibility: visible;
    }
  }

  &.icons-pinned {
    .item-actions .item-icon-group,
    .item-actions .item-actions-separator {
      visibility: visible;
    }
  }

  .item-dots-row {
    display: flex;
    align-items: center;
    padding: 1rem 1.2rem;
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
    gap: 1rem;
    padding: 0rem 1.2rem 1rem 1.2rem;
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme.colorBorder};

    .item-chain-logo {
      width: 1.7rem;
      height: 1.7rem;
      object-fit: cover;
      flex-shrink: 0;
    }

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

    .item-main-badge {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-hover);
      border: 1px solid var(--color-text-hover);
      border-radius: 2rem;
      padding: 0.1rem 0.7rem;
    }
  }

  .item-center {
    flex: 1;
    padding: 1rem 1.2rem;
    min-height: 12rem;
  }

  .item-center-row {
    margin-bottom: 1.2rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .item-label {
    display: block;
    font-size: 1rem;
    font-weight: 400;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.7;
    margin-bottom: 0.2rem;
  }

  .item-value {
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    line-height: 1.4;
  }

  .item-description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    line-height: 1.5;
  }

  .item-no-desc {
    font-style: italic;
    opacity: 0.5;
  }

  .item-stats {
    display: flex;
    gap: 1.6rem;
  }

  .item-stat {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .item-bottom-bar {
    margin: 0 1.2rem;
    border-top: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    padding: 0.8rem 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 2.8rem;
  }

  .item-updated {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 1.4rem;
        height: 1.4rem;
        min-width: 1.4rem;
        min-height: 1.4rem;
        cursor: pointer;
      }
    }

    .item-icon-group {
      display: flex;
      align-items: center;
      gap: 6px;
      visibility: hidden;
    }

    .item-actions-separator {
      width: 1px;
      height: 1.6rem;
      background: ${({ theme }: { theme: ITheme }) => theme.colorBorder};
      flex-shrink: 0;
      visibility: hidden;
    }

    .btn-chat {
      font-size: 1.1rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      cursor: pointer;
      padding: 0.3rem 1rem;
      border-radius: 2rem;
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
      transition: all 0.15s ease;
      text-transform: lowercase;

      &:hover {
        color: #fff;
        background-color: var(--color-primary);
        border-color: var(--color-primary);
      }

      &.btn-chat-primary {
        color: #fff;
        background-color: var(--color-primary);
        border-color: var(--color-primary);

        &:hover {
          opacity: 0.85;
        }
      }
    }

    .btn-delete {
      svg {
        &:hover {
          fill: var(--color-error);
        }
      }
    }
  }
`;

export const ProviderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-radius: 2rem;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  width: fit-content;

  img {
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .provider-name {
    font-size: 1.1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .model-name {
    font-size: 1.1rem;
    color: var(--color-text-hover);

    &::before {
      content: "·";
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-right: 0.4rem;
    }
  }
`;
