import { Op, Model, literal } from "sequelize";
import _ from "lodash";
import { CronExpressionParser } from "cron-parser";
import {
  IGetListResponse,
  IJob,
  ISchedule,
  ISorter,
  ScheduleType,
} from "@/electron/type";
import {
  CampaignModel,
  JobModel,
  Schedule_Job,
  ScheduleModel,
  WorkflowModel,
} from "./index";
import {
  SCHEDULE_REPEAT,
  SCHEDULE_REPEAT_PER_DAY,
  SORT_ORDER,
} from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { formatSchedule } from "@/electron/service/formatData";
import { jobDB } from "./job";
import { appLogDB } from "./appLog";

class ScheduleDB {
  private enrichSchedules = async (
    listSchedule: ISchedule[],
  ): Promise<ISchedule[]> => {
    const allJobIds: number[] = [];
    for (const schedule of listSchedule) {
      for (const job of schedule?.listJob || []) {
        if (job.id) {
          allJobIds.push(job.id);
        }
      }
    }
    if (allJobIds.length > 0) {
      const latestLogsMap = await appLogDB.getLatestLogsForJobs(allJobIds);
      for (const schedule of listSchedule) {
        schedule.listJob = (schedule?.listJob || []).map((job: IJob) => ({
          ...job,
          lastLog: job.id ? latestLogsMap.get(job.id) : undefined,
        }));
      }
    }
    for (const schedule of listSchedule) {
      if (schedule.type === ScheduleType.AGENT && schedule.cronExpr) {
        schedule.nextRunAt = computeNextRunAt(schedule.cronExpr) || undefined;
      }
    }
    return listSchedule;
  };

  totalData = async (): Promise<[number | null, Error | null]> => {
    try {
      return [await ScheduleModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  };

  getListSchedule = async (
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
    scheduleId?: number,
    type?: ScheduleType,
  ): Promise<[IGetListResponse<ISchedule> | null, Error | null]> => {
    try {
      let condition: any = {
        [Op.and]: searchText
          ? {
              [Op.or]: [
                { name: { [Op.like]: `%${searchText}%` } },
                { note: { [Op.like]: `%${searchText}%` } },
              ],
            }
          : {},
      };
      if (type) {
        condition = { type, ...condition };
      }
      if (scheduleId && !isNaN(scheduleId)) {
        condition = { id: scheduleId };
      }

      const sortOrder = sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC";
      const totalDataAwait = ScheduleModel.count({ where: condition });
      let order: any[] = [];
      if (sortField?.field) {
        order = [[sortField?.field, sortOrder]];
        if (sortField?.field !== "updateAt") {
          order.push(["updateAt", sortOrder]);
        }
      }
      const listDataAwait = ScheduleModel.findAll({
        order,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        include: [
          {
            model: JobModel,
            required: false,
            include: [
              { model: WorkflowModel, required: false, as: "workflow" },
              { model: CampaignModel, required: false, as: "campaign" },
            ],
          },
        ],
        raw: false,
      });

      // run in parallel
      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      const totalPage = Math.ceil(totalData / Number(pageSize));
      let listSchedule = listData?.map((item: Model<any, any>) =>
        formatSchedule(item),
      );

      listSchedule = await this.enrichSchedules(listSchedule);

      const scheduleIds = listSchedule
        .map((schedule: ISchedule) => schedule.id!)
        .filter(Boolean);
      const recentLogsMap =
        await appLogDB.getRecentLogsForSchedules(scheduleIds);
      for (const schedule of listSchedule) {
        schedule.recentLogs = recentLogsMap.get(schedule.id!) || [];
      }

      return [
        { data: listSchedule, totalData, page, pageSize, totalPage },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({ message: `getListSchedule() error: ${err?.message}` });
      return [null, err];
    }
  };

  getOneSchedule = async (
    id: number,
  ): Promise<[ISchedule | null, Error | null]> => {
    try {
      const data = await ScheduleModel.findOne({
        where: { id },
        include: [
          {
            model: JobModel,
            required: false,
            include: [
              { model: WorkflowModel, required: false, as: "workflow" },
              { model: CampaignModel, required: false, as: "campaign" },
            ],
          },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }

      const [schedule] = await this.enrichSchedules([formatSchedule(data)]);
      return [schedule, null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneSchedule() error: ${err?.message}` });
      return [null, err];
    }
  };

  createSchedule = async (
    scheduleJob: any,
  ): Promise<[ISchedule | null, Error | null]> => {
    try {
      const { listJob = [], ...scheduleJobData } = scheduleJob;

      const createdSchedule: any = await ScheduleModel.create(
        {
          ...scheduleJobData,
          isCompleted: false,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );

      for (let i = 0; i < listJob.length; i++) {
        const job = listJob[i];
        await jobDB.createJob({
          ...job,
          scheduleId: createdSchedule?.id,
          isRunWithSchedule: true,
        });
      }

      const [scheduleInfo] = await this.getOneSchedule(createdSchedule?.id);
      return [scheduleInfo, null];
    } catch (err: any) {
      logEveryWhere({ message: `createSchedule() error: ${err?.message}` });
      return [null, err];
    }
  };

  updateSchedule = async (
    schedule: ISchedule,
  ): Promise<[ISchedule | null, Error | null]> => {
    try {
      const { listJob = [], ...scheduleData } = schedule;
      const updateScheduleJobData = {
        ...scheduleData,
        updateAt: new Date().getTime(),
      };

      await ScheduleModel.update(_.omit(updateScheduleJobData, ["id"]), {
        where: { id: schedule?.id },
      });

      if (listJob?.length > 0) {
        const [existedSchedule] = await this.getOneSchedule(schedule?.id!);
        const listExistedJob = existedSchedule?.listJob || [];
        const listJobToUpdate = [];
        const listJobToDelete: number[] = [];
        const listNewJob = [];

        for (let i = 0; i < listJob.length; i++) {
          const job = listJob[i];
          if (job?.id) {
            listJobToUpdate.push({ ...job, scheduleId: schedule?.id! });
          } else {
            listNewJob.push(job);
          }
        }

        for (let i = 0; i < listExistedJob?.length; i++) {
          const job = listExistedJob[i];
          if (!listJobToUpdate.find((item) => item?.id === job?.id)) {
            listJobToDelete.push(job?.id!);
          }
        }

        if (listJobToDelete?.length > 0) {
          await jobDB.deleteJob({ id: { [Op.in]: listJobToDelete } });
        }
        if (listNewJob?.length > 0) {
          for (let i = 0; i < listNewJob.length; i++) {
            const job = listNewJob[i];
            await jobDB.createJob({
              ...job,
              scheduleId: schedule?.id!,
              isRunWithSchedule: true,
            });
          }
        }
        if (listJobToUpdate?.length > 0) {
          for (let i = 0; i < listJobToUpdate.length; i++) {
            const job = listJobToUpdate[i];
            await jobDB.updateJob(job);
          }
        }
      }

      const [scheduleInfo] = await this.getOneSchedule(scheduleData?.id!);
      return [scheduleInfo, null];
    } catch (err: any) {
      logEveryWhere({ message: `updateSchedule() error: ${err?.message}` });
      return [null, err];
    }
  };

  deleteSchedule = async (listId: number[]): Promise<Error | null> => {
    try {
      let listSchedule: any[] = await ScheduleModel.findAll({
        where: { id: listId },
        include: [
          {
            model: JobModel,
            required: false,
          },
        ],
        raw: false,
      });
      listSchedule = listSchedule?.map((data: any) => formatSchedule(data));
      const listJobId: number[] = [];
      listSchedule?.forEach((schedule: ISchedule) => {
        const listJob = schedule?.listJob || [];
        listJob.forEach((job) => {
          listJobId.push(job?.id!);
        });
      });

      await ScheduleModel.destroy({
        where: { id: listId },
      });

      const err = await jobDB.deleteJob({
        id: listJobId,
      });
      if (err) {
        return err;
      }

      await Schedule_Job.destroy({
        where: { scheduleId: { [Op.in]: listId } },
      });

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `deleteSchedule() error: ${err?.message}` });
      return err;
    }
  };

  resetScheduleEachDay = async () => {
    try {
      await ScheduleModel.update(
        {
          isCompleted: false,
        },
        { where: { onlyRunOnce: false } },
      );
      await JobModel.update(
        {
          isCompleted: false,
        },
        { where: { onlyRunOnce: false } },
      );
    } catch (err: any) {
      logEveryWhere({
        message: `resetScheduleEachDay() error: ${err?.message}`,
      });
    }
  };

  getScheduleToRunMultipleTimesPerDay = async (): Promise<
    [ISchedule | null, Error | null]
  > => {
    try {
      const currentTime = new Date().getTime();
      const isEvenDay = new Date().getDate() % 2 === 0;
      const repeatCondition = isEvenDay
        ? SCHEDULE_REPEAT.EVEN_DAY
        : SCHEDULE_REPEAT.ODD_DAY;
      const data = await ScheduleModel.findOne({
        where: {
          [Op.and]: [
            literal(
              `(Schedule.lastEndTime + Schedule.durationBetweenRun * 60000) < ${currentTime}`,
            ),
            { isActive: true },
            { isRunning: false },
            { repeatPerDay: SCHEDULE_REPEAT_PER_DAY.MANY_TIME_PER_DAY },
            {
              [Op.or]: [
                { repeat: { [Op.eq]: SCHEDULE_REPEAT.EVERY_DAY } },
                { repeat: { [Op.eq]: repeatCondition } },
              ],
            },
          ],
        },
        order: [
          [
            literal(
              "(Schedule.lastEndTime + Schedule.durationBetweenRun * 60000)",
            ),
            "ASC",
          ],
        ],
        include: [
          {
            model: JobModel,
            required: false,
          },
        ],
        raw: false,
      });
      if (!data) {
        return [null, null];
      }

      let schedule: any = formatSchedule(data);
      const listJob = schedule?.listJob || [];
      for (const job of listJob) {
        if (!job?.isCompleted) {
          continue;
        }
        await jobDB.updateJob({
          id: job?.id!,
          isCompleted: false,
        });
      }

      [schedule] = await this.getOneSchedule(schedule?.id!);
      return [schedule, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getScheduleRunMultipleTimesPerDay() error: ${err?.message}`,
      });
      return [null, err];
    }
  };

  getScheduleToRunOnceTimePerDay = async (): Promise<
    [ISchedule | null, Error | null]
  > => {
    const currentTime = new Date().getTime();
    const isEvenDay = new Date().getDate() % 2 === 0;
    const repeatCondition = isEvenDay
      ? SCHEDULE_REPEAT.EVEN_DAY
      : SCHEDULE_REPEAT.ODD_DAY;

    try {
      const data = await ScheduleModel.findOne({
        where: {
          isCompleted: false,
          isActive: true,
          isRunning: false,
          startTime: { [Op.lte]: currentTime },
          repeatPerDay: SCHEDULE_REPEAT_PER_DAY.ONCE_PER_DAY,
          [Op.or]: [
            { repeat: { [Op.eq]: SCHEDULE_REPEAT.EVERY_DAY } },
            { repeat: { [Op.eq]: repeatCondition } },
          ],
        },
        order: [["startTime", "ASC"]],
        include: [
          {
            model: JobModel,
            required: false,
          },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }

      return [formatSchedule(data), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getScheduleToRunOnceTimePerDay() error: ${err?.message}`,
      });
      return [null, err];
    }
  };

  getNoRepeatScheduleToRun = async (): Promise<
    [ISchedule | null, Error | null]
  > => {
    const currentTime = new Date().getTime();

    try {
      const data = await ScheduleModel.findOne({
        where: {
          isRunning: false,
          isCompleted: false,
          isActive: true,
          startTime: { [Op.lte]: currentTime },
          repeat: SCHEDULE_REPEAT.NO_REPEAT,
        },
        order: [["startTime", "ASC"]],
        include: [
          {
            model: JobModel,
            required: false,
          },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }

      return [formatSchedule(data), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getNoRepeatScheduleToRun() error: ${err?.message}`,
      });
      return [null, err];
    }
  };

  getAllRunningSchedule = async (): Promise<
    [ISchedule[] | null, Error | null]
  > => {
    try {
      const listData = await ScheduleModel.findAll({
        where: {
          isRunning: true,
          isActive: true,
        },
        order: [["startTime", "ASC"]],
        include: [
          {
            model: JobModel,
            required: false,
          },
        ],
        raw: false,
      });
      const listSchedule = listData?.map((item: Model<any, any>) =>
        formatSchedule(item),
      );

      return [listSchedule, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getAllRunningSchedule() error: ${err?.message}`,
      });
      return [null, err];
    }
  };

  setLastStartedAt = async (
    scheduleId: number,
    timestamp: number,
  ): Promise<void> => {
    try {
      await ScheduleModel.update(
        { lastStartedAt: timestamp, updateAt: timestamp },
        { where: { id: scheduleId } },
      );
    } catch (err: any) {
      logEveryWhere({ message: `setLastStartedAt() error: ${err?.message}` });
    }
  };

  getActiveAgentSchedules = async (): Promise<
    [ISchedule[] | null, Error | null]
  > => {
    try {
      const listData = await ScheduleModel.findAll({
        where: {
          isActive: true,
          isPaused: false,
          type: ScheduleType.AGENT,
          cronExpr: { [Op.not]: null },
        },
        include: [
          {
            model: JobModel,
            required: false,
          },
        ],
        raw: false,
      });
      const listSchedule = listData?.map((item: Model<any, any>) =>
        formatSchedule(item),
      );
      return [listSchedule, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getActiveAgentSchedules() error: ${err?.message}`,
      });
      return [null, err];
    }
  };
}

const computeNextRunAt = (cronExpr: string): number | null => {
  try {
    return CronExpressionParser.parse(cronExpr).next().getTime();
  } catch {
    return null;
  }
};

const scheduleDB = new ScheduleDB();
export { scheduleDB };
