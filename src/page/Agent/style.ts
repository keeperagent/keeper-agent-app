import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  width: 100%;
  height: calc(100vh - 6.9rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;
  overflow: hidden;

  .tab {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    gap: 12px;
    flex-wrap: wrap;
  }

  .agent-status {
    display: flex;
    align-items: center;
    margin-left: auto;
    gap: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 1.2rem;

    .agent-status__badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.8rem;
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      background: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    }

    .agent-status__value {
      font-weight: 700;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }

    .agent-status__label {
      font-size: 1rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      text-transform: lowercase;
    }
  }

  .list-provider {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 1rem;

    .current-model {
      font-size: 1.2rem;
      font-weight: 600;
      margin-right: var(--margin-right);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
      padding: 3px 1rem;
      border-radius: 0.5rem;
      color: var(--color-text-hover);
      border: 1px dashed var(--color-text-hover);
    }

    .provider-item {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px solid transparent;
      opacity: 0.45;
      transition: all 0.2s ease;

      &:hover {
        opacity: 0.8;
      }

      &.active {
        opacity: 1;
        border-color: ${({ theme }: { theme: ITheme }) => theme.colorPrimary};
      }

      &.disabled {
        opacity: 0.2;
        cursor: not-allowed;

        &:hover {
          opacity: 0.2;
        }
      }

      img {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        object-fit: contain;
      }
    }
  }

  > *:not(.tab) {
    flex: 1;
    width: 100%;
    overflow: hidden;
  }
`;

export { Wrapper };
