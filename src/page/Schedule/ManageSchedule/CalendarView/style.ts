import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const CalendarWrapper = styled.div`
  flex: 1;
  width: 100%;
  overflow-y: auto;
  padding: 0 0 1.6rem;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .fc {
    width: 100%;
    font-size: 1.2rem;
    font-family: inherit;
    --fc-border-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    --fc-page-bg-color: transparent;
    --fc-neutral-bg-color: transparent;
    --fc-small-font-size: 1.1rem;
    --fc-today-bg-color: transparent;
    --fc-event-border-color: transparent;
    --fc-list-event-hover-bg-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTag};
  }

  .fc-theme-standard td,
  .fc-theme-standard th {
    border-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }

  .fc-theme-standard .fc-scrollgrid {
    border-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }

  /* Toolbar */
  .fc-toolbar {
    margin-bottom: 1.6rem !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 0.8rem !important;
  }

  .fc-toolbar-chunk {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 0.8rem !important;
  }

  .fc-toolbar-title {
    font-size: 1.6rem !important;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .fc-button {
    font-size: 1.2rem !important;
    padding: 0.5rem 1.2rem !important;
    border-radius: 0.6rem !important;
    text-transform: capitalize !important;
    box-shadow: none !important;
    outline: none !important;
    background-color: transparent !important;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder} !important;
    color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextPrimary} !important;
    font-weight: 500;
    cursor: pointer !important;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      background-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTransparent} !important;
      border-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBorder} !important;
    }

    &:focus {
      box-shadow: none !important;
    }
  }

  .fc-button-primary:not(:disabled).fc-button-active,
  .fc-button-primary:not(:disabled):active {
    background-color: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
    color: white !important;
  }

  .fc-button-group .fc-button {
    border-radius: 0 !important;

    &:first-child {
      border-radius: 0.6rem 0 0 0.6rem !important;
    }

    &:last-child {
      border-radius: 0 0.6rem 0.6rem 0 !important;
    }
  }

  /* Column headers */
  .fc-col-header-cell {
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  }

  .fc-col-header-cell-cushion {
    font-size: 1.1rem !important;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextSecondary} !important;
    text-decoration: none !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.8rem 0 !important;
  }

  /* Day numbers */
  .fc-daygrid-day-number {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    text-decoration: none !important;
    padding: 0.6rem 0.8rem !important;
    line-height: 1;
  }

  /* Today cell */
  .fc-day-today {
    background-color: transparent !important;

    .fc-daygrid-day-number {
      background: var(--color-primary);
      color: white !important;
      border-radius: 50%;
      width: 2.6rem;
      height: 2.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0.4rem;
      padding: 0 !important;
      font-weight: 600;
    }
  }

  /* Events */
  .fc-event {
    border-radius: 0.4rem !important;
    border: none !important;
    cursor: pointer;
    transition:
      opacity 0.15s ease,
      transform 0.1s ease;

    &:hover {
      opacity: 0.85;
      transform: translateY(-1px);
    }
  }

  .fc-daygrid-day-events {
    padding: 0 1rem;
  }

  .fc-daygrid-event-harness {
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
  }

  .fc-daygrid-event-dot {
    display: none;
  }

  .fc-event-title {
    font-size: 1.1rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* "+N more" link */
  .fc-daygrid-more-link {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    padding: 0 0.4rem;

    &:hover {
      color: var(--color-primary);
      background: transparent;
    }
  }

  /* Compact row height so more of the day is visible */
  .fc-timegrid-slot {
    height: 3rem !important;
  }

  /* Hide dotted 30-min minor lines — cleaner look */
  .fc-timegrid-slot-minor {
    border-top-style: none !important;
  }

  /* Time labels */
  .fc-timegrid-slot-label-cushion,
  .fc-timegrid-axis-cushion {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    padding-right: 0.8rem;
  }

  /* Today column — very subtle primary tint */
  .fc-timegrid-col.fc-day-today {
    background-color: rgba(79, 70, 229, 0.04) !important;
  }

  /* Today column header — primary color text */
  .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
    color: var(--color-primary) !important;
  }

  /* Now indicator — line */
  .fc-timegrid-now-indicator-line {
    border-color: var(--color-primary);
    border-width: 2px;
    left: 0 !important;
  }

  /* Now indicator — circle dot (Google Calendar style) */
  .fc-timegrid-now-indicator-arrow {
    border: none !important;
    width: 1rem;
    height: 1rem;
    background: var(--color-primary);
    border-radius: 50%;
    top: -0.45rem;
    margin-left: -0.1rem;
  }

  /* Timegrid event inner padding */
  .fc-timegrid-event .fc-event-main {
    padding: 0.3rem 0.6rem;
    overflow: hidden;
  }

  .fc-timegrid-event {
    border-radius: 0.5rem !important;
    border: none !important;
  }

  /* All-day row label */
  .fc-timegrid-axis {
    font-size: 1rem;
  }

  /* Popover ("+N more") */
  .fc-popover {
    background: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgPrimary} !important;
    border-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBorder} !important;
    border-radius: 0.8rem !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18) !important;
    overflow: hidden;

    .fc-popover-header {
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTag} !important;
      padding: 0.6rem 1rem !important;

      .fc-popover-title {
        color: ${({ theme }: { theme: ITheme }) =>
          theme?.colorTextPrimary} !important;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .fc-popover-close {
        color: ${({ theme }: { theme: ITheme }) =>
          theme?.colorTextSecondary} !important;
        font-size: 1.4rem;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }
    }

    .fc-popover-body {
      padding: 0.6rem !important;
      max-height: 28rem;
      overflow-y: auto;
    }
  }
`;

export const EventTile = styled.div<{ $isRunning: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.15rem 0.6rem;
  width: 100%;
  overflow: hidden;

  .title {
    font-size: 1.1rem;
    font-weight: 500;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
    padding: 0.2rem 0.4rem;
  }

  .running-badge {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: var(--color-success);
    flex-shrink: 0;
    animation: runPulse 1.4s ease-in-out infinite;
  }

  @keyframes runPulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.45;
      transform: scale(0.7);
    }
  }
`;

export const TooltipContent = styled.div`
  min-width: 18rem;
  max-width: 26rem;

  .tooltip-name {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 0.3rem;
    color: white;
  }

  .tooltip-note {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.8rem;
    line-height: 1.4;
  }

  .tooltip-row {
    display: flex;
    justify-content: space-between;
    gap: 1.2rem;
    margin-top: 0.5rem;
    font-size: 1.1rem;

    .label {
      color: rgba(255, 255, 255, 0.5);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .value {
      color: white;
      text-align: right;
      word-break: break-word;

      &.success {
        color: var(--color-success);
      }

      &.error {
        color: var(--color-error);
      }

      &.running {
        color: var(--color-success);
      }
    }
  }
`;
