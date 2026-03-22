import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DatesSetArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { CronExpressionParser } from "cron-parser";
import { ISchedule, ScheduleType, AgentScheduleStatus } from "@/electron/type";
import { Tooltip } from "antd";
import cronstrue from "cronstrue";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { CalendarWrapper, EventTile, TooltipContent } from "./style";
import { SCHEDULE_REPEAT } from "@/electron/constant";
import { useTranslation } from "@/hook";

interface IProps {
  listSchedule: ISchedule[];
  runningAgentScheduleIds: number[];
  onEditSchedule: (schedule: ISchedule) => void;
}

const PAUSED_EVENT_COLOR = "var(--color-text-secondary)";

const SCHEDULE_PALETTE = [
  "#45aaf2",
  "#fd9644",
  "#26de81",
  "#E84393",
  "#ffd32a",
  "#2bcbba",
  "#e17055",
  "#0984E3",
  "#C4E538",
  "#FD79A8",
  "#00B894",
  "#FDCB6E",
  "#0652DD",
  "#fa8231",
  "#17c0eb",
  "#badc58",
  "#1289A7",
  "#f368e0",
  "#fed330",
  "#20bf6b",
  "#74b9ff",
  "#eccc68",
  "#00CEC9",
  "#6ab04c",
  "#2d98da",
  "#B8E994",
  "#6a89cc",
  "#0fb9b1",
  "#1dd1a1",
  "#ff6b9d",
];

const getScheduleColor = (scheduleId: number): string => {
  return SCHEDULE_PALETTE[scheduleId % SCHEDULE_PALETTE.length];
};

const generateCalendarEvents = (
  listSchedule: ISchedule[],
  runningAgentScheduleIds: number[],
  rangeStart: Date,
  rangeEnd: Date,
): EventInput[] => {
  const events: EventInput[] = [];

  for (const schedule of listSchedule) {
    const isRunning = runningAgentScheduleIds.includes(schedule.id!);
    const isPaused = Boolean(schedule.isPaused);

    const backgroundColor = isPaused
      ? PAUSED_EVENT_COLOR
      : getScheduleColor(schedule.id!);

    const eventBase: Partial<EventInput> = {
      title: schedule.name || "",
      backgroundColor,
      borderColor: "transparent",
      display: "block",
      extendedProps: { schedule, isRunning },
    };

    if (schedule.type === ScheduleType.AGENT && schedule.cronExpr) {
      try {
        // Detect interval by comparing two consecutive occurrences
        const probeInterval = CronExpressionParser.parse(schedule.cronExpr, {
          currentDate: rangeStart,
        } as any);
        const firstOccurrence = probeInterval.next().toDate();
        const secondOccurrence = probeInterval.next().toDate();
        const intervalMinutes =
          (secondOccurrence.getTime() - firstOccurrence.getTime()) / 60000;

        const projectedOccurrences = Math.ceil(
          (rangeEnd.getTime() - rangeStart.getTime()) /
            (intervalMinutes * 60_000),
        );
        if (projectedOccurrences > 150) {
          const current = new Date(rangeStart);
          let dayCount = 0;
          while (current <= rangeEnd && dayCount < 150) {
            const dayStart = new Date(current);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(current);
            dayEnd.setHours(23, 59, 59, 999);
            try {
              const dayInterval = CronExpressionParser.parse(
                schedule.cronExpr,
                { currentDate: dayStart, endDate: dayEnd } as any,
              );
              const firstRunOfDay = dayInterval.next().toDate();
              events.push({
                ...eventBase,
                id: `agent-${schedule.id}-day-${dayCount}`,
                start: firstRunOfDay,
              });
            } catch {
              // no occurrence on this day
            }
            current.setDate(current.getDate() + 1);
            dayCount++;
          }
        } else {
          // Normal frequency: show each individual occurrence
          const interval = CronExpressionParser.parse(schedule.cronExpr, {
            currentDate: rangeStart,
            endDate: rangeEnd,
          } as any);
          let count = 0;
          while (count < 150) {
            try {
              const nextDate = interval.next().toDate();
              events.push({
                ...eventBase,
                id: `agent-${schedule.id}-${count}`,
                start: nextDate,
              });
              count++;
            } catch {
              break;
            }
          }
        }
      } catch {}
    } else if (schedule.type === ScheduleType.WORKFLOW && schedule.startTime) {
      const templateDate = new Date(schedule.startTime);
      const hours = templateDate.getHours();
      const minutes = templateDate.getMinutes();

      if (schedule.repeat === SCHEDULE_REPEAT.NO_REPEAT) {
        if (templateDate >= rangeStart && templateDate <= rangeEnd) {
          events.push({
            ...eventBase,
            id: `workflow-${schedule.id}`,
            start: templateDate,
          });
        }
      } else {
        const loopStart = new Date(
          Math.max(rangeStart.getTime(), templateDate.getTime()),
        );
        loopStart.setHours(0, 0, 0, 0);
        const current = new Date(loopStart);
        let count = 0;

        while (current <= rangeEnd && count < 150) {
          const dayOfMonth = current.getDate();
          const shouldInclude =
            schedule.repeat === SCHEDULE_REPEAT.EVERY_DAY ||
            (schedule.repeat === SCHEDULE_REPEAT.ODD_DAY &&
              dayOfMonth % 2 !== 0) ||
            (schedule.repeat === SCHEDULE_REPEAT.EVEN_DAY &&
              dayOfMonth % 2 === 0);

          if (shouldInclude) {
            const eventDate = new Date(current);
            eventDate.setHours(hours, minutes, 0, 0);
            events.push({
              ...eventBase,
              id: `workflow-${schedule.id}-${count}`,
              start: eventDate,
            });
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
      }
    }
  }

  return events;
};

const CalendarView = ({
  listSchedule,
  runningAgentScheduleIds,
  onEditSchedule,
}: IProps) => {
  const { translate } = useTranslation();

  const now = new Date();
  const [visibleRange, setVisibleRange] = useState({
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth() + 3, 0),
  });

  const events = useMemo(
    () =>
      generateCalendarEvents(
        listSchedule,
        runningAgentScheduleIds,
        visibleRange.start,
        visibleRange.end,
      ),
    [listSchedule, runningAgentScheduleIds, visibleRange],
  );

  const onDatesSet = (dateInfo: DatesSetArg) => {
    setVisibleRange({ start: dateInfo.start, end: dateInfo.end });
  };

  const onEventClick = (clickInfo: any) => {
    const { schedule } = clickInfo.event.extendedProps;
    onEditSchedule(schedule);
  };

  const renderEventContent = (eventArg: EventContentArg) => {
    const { schedule, isRunning } = eventArg.event.extendedProps as {
      schedule: ISchedule;
      isRunning: boolean;
    };

    let cronHuman = "";
    if (schedule.type === ScheduleType.AGENT && schedule.cronExpr) {
      try {
        cronHuman = cronstrue.toString(schedule.cronExpr, {
          use24HourTimeFormat: true,
        });
      } catch {}
    }

    const lastLog = schedule.recentLogs?.[schedule.recentLogs.length - 1];
    const lastStatus = lastLog?.status;
    const nextRunLabel = schedule.nextRunAt
      ? dayjs(schedule.nextRunAt).fromNow()
      : null;

    const statusColorClass =
      lastStatus === AgentScheduleStatus.SUCCESS
        ? "success"
        : lastStatus === AgentScheduleStatus.ERROR
          ? "error"
          : "";

    const tooltipNode = (
      <TooltipContent>
        <div className="tooltip-name">{schedule.name}</div>
        {schedule.note && <div className="tooltip-note">{schedule.note}</div>}

        {cronHuman && (
          <div className="tooltip-row">
            <span className="label">
              {translate("schedule.scheduleColumn")}:
            </span>
            <span className="value">{cronHuman}</span>
          </div>
        )}

        {nextRunLabel && (
          <div className="tooltip-row">
            <span className="label">{translate("schedule.nextRun")}:</span>
            <span className="value">{nextRunLabel}</span>
          </div>
        )}

        {lastStatus && (
          <div className="tooltip-row">
            <span className="label">{translate("schedule.lastStatus")}:</span>
            <span className={`value ${statusColorClass}`}>{lastStatus}</span>
          </div>
        )}

        {isRunning && (
          <div className="tooltip-row">
            <span className="label">{translate("status")}:</span>
            <span className="value running">● {translate("running")}</span>
          </div>
        )}
      </TooltipContent>
    );

    return (
      <Tooltip title={tooltipNode} placement="top" mouseEnterDelay={0.4}>
        <EventTile $isRunning={isRunning}>
          <span className="title">{eventArg.event.title}</span>
          {isRunning && <span className="running-badge" />}
        </EventTile>
      </Tooltip>
    );
  };

  return (
    <CalendarWrapper>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "",
          right: "title dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: translate("calendar.today"),
          month: translate("calendar.month"),
          week: translate("calendar.week"),
          day: translate("calendar.day"),
        }}
        events={events}
        eventContent={renderEventContent}
        eventClick={onEventClick}
        datesSet={onDatesSet}
        height="auto"
        dayMaxEvents={3}
        allDaySlot={false}
        nowIndicator
        scrollTime={dayjs().subtract(1, "hour").format("HH:mm:ss")}
        slotLabelInterval="01:00:00"
      />
    </CalendarWrapper>
  );
};

export default CalendarView;
