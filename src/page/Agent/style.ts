import styled from "styled-components";
import { Tag } from "antd";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;

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
  }

  .model-name-wrapper {
    position: relative;
    display: inline-flex;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
`;

const StatBadgeWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.8rem;
  font-size: 1.1rem;
  color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};

  .value {
    font-weight: 700;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
  }

  .label {
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    text-transform: lowercase;
  }
`;

const CliTag = styled(Tag)`
  position: absolute;
  top: -8px;
  right: -5px;
  font-size: 9px;
  line-height: 14px;
  padding: 0 4px;
  margin: 0;
  border-radius: 4px;
`;

const AgentHubTabWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-size: 1.6rem;
  overflow-y: auto;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: var(--margin-bottom);

    .header-search {
      width: 32rem;
      max-width: 100%;
      flex-shrink: 0;
    }

    .header-add-btn {
      flex-shrink: 0;
    }
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;

    & > * {
      flex: 0 0 calc((100% - 4rem) / 3);
    }
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 20rem;
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem 2rem;
    color: var(--color-text-secondary);

    &__title {
      font-size: 1.6rem;
      font-weight: 600;
      margin-bottom: 0.8rem;
    }

    &__desc {
      font-size: 1.3rem;
      margin-bottom: 2rem;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding: 1.6rem 0;
  }
`;

export { Wrapper, StatBadgeWrapper, CliTag, AgentHubTabWrapper };
