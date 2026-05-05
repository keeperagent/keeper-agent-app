import { Op, literal } from "sequelize";
import _ from "lodash";
import {
  IAppLog,
  IGetListResponse,
  AppLogType,
  AppLogActorType,
  AgentScheduleStatus,
  JobType,
} from "@/electron/type";
import { SCHEDULE_LOG_ACTION } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import {
  AppLogModel,
  AgentTaskModel,
  CampaignModel,
  WorkflowModel,
  ScheduleModel,
  JobModel,
} from "./index";

class AppLogDB {
  async getListAppLog({
    page,
    pageSize,
    searchText,
    logType,
    scheduleId,
    taskId,
    jobType,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    logType?: AppLogType;
    scheduleId?: number;
    taskId?: number;
    jobType?: string;
  }): Promise<[IGetListResponse<IAppLog> | null, Error | null]> {
    try {
      const conditions: any[] = [];

      if (logType) {
        conditions.push({ logType });
      }
      if (scheduleId) {
        conditions.push({ scheduleId });
      }
      if (taskId) {
        conditions.push({ taskId });
      }
      if (jobType === JobType.AGENT) {
        conditions.push({ action: JobType.AGENT });
      } else if (jobType === JobType.WORKFLOW) {
        conditions.push({
          action: {
            [Op.in]: [
              JobType.WORKFLOW,
              SCHEDULE_LOG_ACTION.JOB_START,
              SCHEDULE_LOG_ACTION.JOB_COMPLETED,
              SCHEDULE_LOG_ACTION.JOB_TIMEOUT,
            ],
          },
        });
      }
      if (searchText) {
        conditions.push({
          [Op.or]: [
            { message: { [Op.like]: `%${searchText}%` } },
            { action: { [Op.like]: `%${searchText}%` } },
            { actorName: { [Op.like]: `%${searchText}%` } },
            { status: { [Op.like]: `%${searchText}%` } },
            { result: { [Op.like]: `%${searchText}%` } },
            { errorMessage: { [Op.like]: `%${searchText}%` } },
          ],
        });
      }

      const where = conditions.length > 0 ? { [Op.and]: conditions } : {};

      const [totalData, listData]: any = await Promise.all([
        AppLogModel.count({ where }),
        AppLogModel.findAll({
          where,
          order: [["createAt", "DESC"]],
          limit: pageSize,
          offset: (page - 1) * pageSize,
          include: [
            { model: CampaignModel, as: "campaign", required: false },
            { model: WorkflowModel, as: "workflow", required: false },
            { model: ScheduleModel, as: "schedule", required: false },
          ],
          raw: false,
        }),
      ]);

      const totalPage = Math.ceil(totalData / pageSize);
      const data = listData.map((item: any) => item.toJSON() as IAppLog);
      return [{ data, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListAppLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneAppLog(id: number): Promise<[IAppLog | null, Error | null]> {
    try {
      const data = await AppLogModel.findOne({ where: { id }, raw: false });
      if (!data) {
        return [null, null];
      }
      return [(data as any).toJSON() as IAppLog, null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneAppLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createAppLog(
    data: Partial<IAppLog>,
  ): Promise<[IAppLog | null, Error | null]> {
    try {
      const now = Date.now();
      const record = await AppLogModel.create({
        ..._.omit(data, ["id", "campaign", "workflow", "schedule"]),
        createAt: now,
        updateAt: now,
      } as any);
      return [(record as any).toJSON() as IAppLog, null];
    } catch (err: any) {
      logEveryWhere({ message: `createAppLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateAppLog(
    id: number,
    data: Partial<IAppLog>,
  ): Promise<[IAppLog | null, Error | null]> {
    try {
      await AppLogModel.update(
        {
          ..._.omit(data, ["id", "campaign", "workflow", "schedule"]),
          updateAt: Date.now(),
        } as any,
        { where: { id, logType: AppLogType.SCHEDULE } },
      );
      return this.getOneAppLog(id);
    } catch (err: any) {
      logEveryWhere({ message: `updateAppLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteAppLog(listId: number[]): Promise<[number | null, Error | null]> {
    try {
      const count = await AppLogModel.destroy({ where: { id: listId } });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteAppLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteAppLogCron(
    minTimestamp: number,
    logType?: AppLogType,
  ): Promise<boolean> {
    try {
      const where: any = logType
        ? {
            [Op.and]: [
              { logType },
              literal(`AppLogs.createAt < ${minTimestamp}`),
            ],
          }
        : literal(`AppLogs.createAt < ${minTimestamp}`);
      await AppLogModel.destroy({ where });
      return true;
    } catch (err: any) {
      logEveryWhere({ message: `deleteAppLogCron() error: ${err?.message}` });
      return false;
    }
  }

  async getListAppLogByAgentProfileId(
    agentProfileId: number,
    page: number,
    pageSize: number,
  ): Promise<[IGetListResponse<IAppLog> | null, Error | null]> {
    try {
      const jobs: any[] = await JobModel.findAll({
        where: { agentProfileId },
        attributes: ["id"],
        raw: true,
      });
      const jobIds = jobs.map((job) => job.id);

      const scheduleCondition = jobIds.length
        ? { logType: AppLogType.SCHEDULE, jobId: { [Op.in]: jobIds } }
        : null;
      const taskCondition = {
        logType: AppLogType.TASK,
        actorType: AppLogActorType.AGENT,
        actorId: agentProfileId,
      };
      const where: any = scheduleCondition
        ? { [Op.or]: [scheduleCondition, taskCondition] }
        : taskCondition;

      const [totalData, listData]: any = await Promise.all([
        AppLogModel.count({ where }),
        AppLogModel.findAll({
          where,
          order: [["createAt", "DESC"]],
          limit: pageSize,
          offset: (page - 1) * pageSize,
          include: [
            { model: ScheduleModel, as: "schedule", required: false },
            { model: AgentTaskModel, as: "task", required: false },
          ],
          raw: false,
        }),
      ]);

      const totalPage = Math.ceil(totalData / pageSize);
      const data = listData.map((item: any) => item.toJSON() as IAppLog);
      return [{ data, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListAppLogByAgentProfileId() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  // Called on startup to reset any RUNNING schedule logs (interrupted by app restart)
  async resetRunningScheduleLogs(): Promise<void> {
    try {
      await AppLogModel.update(
        {
          status: AgentScheduleStatus.ERROR,
          errorMessage: "Interrupted: app restarted while job was running",
          finishedAt: Date.now(),
          updateAt: Date.now(),
        } as any,
        {
          where: {
            logType: AppLogType.SCHEDULE,
            status: AgentScheduleStatus.RUNNING,
          },
        },
      );
    } catch (err: any) {
      logEveryWhere({
        message: `resetRunningScheduleLogs() error: ${err?.message}`,
      });
    }
  }

  async getRetryingScheduleLogs(nowMs: number): Promise<IAppLog[]> {
    try {
      const data: any[] = await AppLogModel.findAll({
        where: {
          logType: AppLogType.SCHEDULE,
          status: AgentScheduleStatus.RETRYING,
          nextRetryAt: { [Op.lte]: nowMs },
        },
        raw: false,
      });
      return data.map((item) => item.toJSON() as IAppLog);
    } catch (err: any) {
      logEveryWhere({
        message: `getRetryingScheduleLogs() error: ${err?.message}`,
      });
      return [];
    }
  }

  async getLatestScheduleJobLog(
    scheduleId: number,
    jobId: number,
  ): Promise<IAppLog | null> {
    try {
      const data = await AppLogModel.findOne({
        where: {
          logType: AppLogType.SCHEDULE,
          scheduleId,
          jobId,
          status: AgentScheduleStatus.SUCCESS,
        },
        order: [["createAt", "DESC"]],
        raw: false,
      });
      if (!data) {
        return null;
      }
      return (data as any).toJSON() as IAppLog;
    } catch (err: any) {
      logEveryWhere({
        message: `getLatestScheduleJobLog() error: ${err?.message}`,
      });
      return null;
    }
  }

  async getLatestLogsForJobs(jobIds: number[]): Promise<Map<number, IAppLog>> {
    try {
      if (!jobIds.length) {
        return new Map();
      }
      const rows: any[] = await AppLogModel.findAll({
        where: {
          logType: AppLogType.SCHEDULE,
          jobId: { [Op.in]: jobIds },
        },
        order: [["createAt", "DESC"]],
        raw: false,
      });
      const result = new Map<number, IAppLog>();
      for (const row of rows) {
        const log = row.toJSON() as IAppLog;
        if (log.jobId != null && !result.has(log.jobId)) {
          result.set(log.jobId, log);
        }
      }
      return result;
    } catch (err: any) {
      logEveryWhere({
        message: `getLatestLogsForJobs() error: ${err?.message}`,
      });
      return new Map();
    }
  }

  async getRecentLogsForSchedules(
    scheduleIds: number[],
    limitPerSchedule = 10,
  ): Promise<Map<number, IAppLog[]>> {
    try {
      if (!scheduleIds.length) {
        return new Map();
      }
      const result = new Map<number, IAppLog[]>();
      for (const scheduleId of scheduleIds) {
        const rows: any[] = await AppLogModel.findAll({
          where: { logType: AppLogType.SCHEDULE, scheduleId },
          order: [["createAt", "DESC"]],
          limit: limitPerSchedule,
          raw: false,
        });
        result.set(
          scheduleId,
          rows.map((item) => item.toJSON() as IAppLog).reverse(),
        );
      }
      return result;
    } catch (err: any) {
      logEveryWhere({
        message: `getRecentLogsForSchedules() error: ${err?.message}`,
      });
      return new Map();
    }
  }
}

const appLogDB = new AppLogDB();
export { appLogDB };
