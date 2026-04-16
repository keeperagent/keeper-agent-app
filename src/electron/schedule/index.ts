import dayjs from "dayjs";
import cron from "node-cron";
import { preferenceService } from "@/electron/service/preference";
import { scheduleDB } from "@/electron/database/schedule";
import { workflowManager } from "@/electron/simulator/workflow";
import { logEveryWhere, sleep } from "@/electron/service/util";
import { appLogDB } from "@/electron/database/appLog";
import { AppLogType, IPreference, ISchedule } from "@/electron/type";
import { jobDB } from "@/electron/database/job";
import { ScheduleRunner } from "./runner";

class ScheduleManager {
  private preference: IPreference | null;
  private mapScheduleRunner: Map<number, ScheduleRunner> = new Map();

  constructor() {
    this.preference = null;
    this.mapScheduleRunner = new Map();
  }

  markJobCompleted = async (jobId: number) => {
    const [job] = await jobDB.getOneJob(jobId);
    if (!job) {
      return;
    }

    const [schedule] = await scheduleDB.getOneSchedule(job?.scheduleId!);
    if (!schedule) {
      return;
    }

    const scheduleRunner = this.getScheduleRunner(schedule);
    await scheduleRunner.markJobCompleted(job);
  };

  start = async () => {
    const [preference] = await preferenceService.getOnePreference();
    this.preference = preference;

    this.cronDeleteOldLog();
    this.cronResetScheduleEachDay();
    this.cronUpdatePreference();

    await this.restartAllRunningSchedule();
    this.cronSchechuleRunMultipleTimesPerDay();
    this.cronSchechuleRunOnceTimePerDay();
    this.cronNoRepeatSchechule();
  };

  private getScheduleRunner = (schedule: ISchedule): ScheduleRunner => {
    const scheduleRunner = this.mapScheduleRunner.get(schedule?.id!);
    if (scheduleRunner) {
      return scheduleRunner;
    }

    const newScheduleRunner = new ScheduleRunner(schedule);
    this.mapScheduleRunner.set(schedule?.id!, newScheduleRunner);
    return newScheduleRunner;
  };

  private restartAllRunningSchedule = async () => {
    logEveryWhere({ message: "restart all running schedule" });
    while (!this.preference) {
      await sleep(5000);
    }
    while (this.preference?.isStopAllSchedule) {
      await sleep(60000);
    }

    const [listSchedule] = await scheduleDB.getAllRunningSchedule();
    if (!listSchedule) {
      return;
    }

    logEveryWhere({
      message: `restart ${listSchedule.length} running schedule`,
    });
    for (const schedule of listSchedule) {
      // wait until all schedule triggered because app limit cocurrent workflow with @maxConcurrentJob
      while (true) {
        const isTriggered = await this.triggerSchedule(schedule, false); // do not reset round when restart schedule when app launched
        if (isTriggered) {
          break;
        }
        await sleep(30000);
      }
    }
  };

  private cronSchechuleRunMultipleTimesPerDay = async () => {
    logEveryWhere({
      message: "run cron for schechule which run multiple times per day",
    });
    while (true) {
      if (!this.preference || this.preference?.isStopAllSchedule) {
        await sleep(60000);
        continue;
      }

      const [schedule] = await scheduleDB.getScheduleToRunMultipleTimesPerDay();
      const isTriggered = await this.triggerSchedule(schedule, true);
      if (isTriggered) {
        await sleep(1000);
      } else {
        await sleep(60000);
      }
    }
  };

  private cronSchechuleRunOnceTimePerDay = async () => {
    logEveryWhere({
      message: "run cron for schechule which run once time per day",
    });
    while (true) {
      if (!this.preference || this.preference?.isStopAllSchedule) {
        await sleep(60000);
        continue;
      }

      const [schedule] = await scheduleDB.getScheduleToRunOnceTimePerDay();
      const isTriggered = await this.triggerSchedule(schedule, true);
      if (isTriggered) {
        await sleep(1000);
      } else {
        await sleep(60000);
      }
    }
  };

  private cronNoRepeatSchechule = async () => {
    logEveryWhere({ message: "run cron for schechule which is not repeat" });
    while (true) {
      if (!this.preference || this.preference?.isStopAllSchedule) {
        await sleep(60000);
        continue;
      }

      const [schedule] = await scheduleDB.getNoRepeatScheduleToRun();
      const isTriggered = await this.triggerSchedule(schedule, true);
      if (isTriggered) {
        await sleep(1000);
      } else {
        await sleep(60000);
      }
    }
  };

  private triggerSchedule = async (
    schedule: ISchedule | null,
    shouldResetRound: boolean,
  ): Promise<boolean> => {
    if (!schedule) {
      return false;
    }

    const maxRunningWorkflow = this.preference?.maxConcurrentJob || 0;
    const totalRunningWorkflow = workflowManager.totalRunningWorkflow();
    if (totalRunningWorkflow >= maxRunningWorkflow) {
      return false;
    }

    await scheduleDB.updateSchedule({ id: schedule?.id, isRunning: true });
    const scheduleRunner = this.getScheduleRunner(schedule);
    scheduleRunner.run(shouldResetRound);
    return true;
  };

  private cronUpdatePreference = () => {
    // every 1 minutes
    cron.schedule("*/1 * * * *", async () => {
      const [preference] = await preferenceService.getOnePreference();
      this.preference = preference;
    });
  };

  private cronResetScheduleEachDay = async () => {
    // every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
      if (!this.preference) {
        return;
      }

      const { dayResetJobStatus = 0 } = this.preference;
      const currentDay = new Date();
      if (
        dayResetJobStatus > 0 &&
        dayjs(currentDay).diff(dayjs(dayResetJobStatus), "day") === 0
      ) {
        return;
      }

      await scheduleDB.resetScheduleEachDay();
      // mark job is reseted for current day
      await preferenceService.updatePreference({
        id: this.preference?.id,
        dayResetJobStatus: currentDay.getTime(),
      });
    });
  };

  private cronDeleteOldLog = () => {
    // run every hour
    cron.schedule("0 * * * *", async () => {
      if (!this.preference) {
        return;
      }
      const currentDate = new Date().getTime();
      const logTypes = [
        { age: this.preference.maxLogAge, type: AppLogType.SCHEDULE },
        { age: this.preference.maxHistoryLogAge, type: AppLogType.WORKFLOW },
      ];
      for (const { age, type } of logTypes) {
        if (!age || age <= 0) {
          continue;
        }
        const minDay = dayjs(currentDate).subtract(age, "day").toDate();
        await appLogDB.deleteAppLogCron(minDay.getTime(), type);
      }
    });
  };
}

const scheduleManager = new ScheduleManager();
export { scheduleManager };
