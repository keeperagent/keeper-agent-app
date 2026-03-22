import { ITheme } from "@/style/theme";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;

  .schedule-cell {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    .cron-human {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
    .repeat-label {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .next-run {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }
  }

  .active-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    .last-run-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;

      .last-run-time {
        font-size: 1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        white-space: nowrap;
      }
    }

    .run-history {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      .history-dot {
        display: inline-block;
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 0.1rem;
        flex-shrink: 0;
        cursor: default;
      }
    }
  }

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    & > * {
      margin-left: 1rem;
    }

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      cursor: pointer;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }

    .spin svg {
      cursor: default;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }
`;

const ExpandIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
  width: 1.5rem;
  overflow: hidden;

  svg {
    height: 2rem;
    width: 2rem;
    min-width: 2rem;
    min-height: 2rem;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    min-width: 1.5rem;
    min-height: 1.5rem;
  }
`;

const ScheduleNameWrapper = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
  width: 100%;

  &:hover {
    .name-text {
      color: var(--color-text-hover);
      font-weight: 500;
    }
  }

  .name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    overflow: hidden;

    .name-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
      flex: 1;
    }
  }

  .note {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .ant-badge-status-dot {
    width: 0.8rem !important;
    height: 0.8rem !important;
  }
`;

const ExpandRowWrapper = styled.div`
  display: flex;
  flex-direction: column;

  .date {
    display: flex;
    margin-bottom: var(--margin-bottom);

    .item {
      margin-right: 3rem;

      .label {
        font-weight: 600;
        font-size: 1.2rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }

      .value {
        font-size: 1.2rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }
`;

export {
  Wrapper,
  ExpandIconWrapper,
  IconWrapper,
  ScheduleNameWrapper,
  ExpandRowWrapper,
};
