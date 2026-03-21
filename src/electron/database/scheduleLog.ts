import { Op, Model, literal } from "sequelize";
import _ from "lodash";
import {
  IScheduleLog,
  IGetListResponse,
  ISorter,
  AgentScheduleStatus,
} from "@/electron/type";
import {
  ScheduleLogModel,
  CampaignModel,
  WorkflowModel,
  ScheduleModel,
} from "./index";
import { formatScheduleLog } from "@/electron/service/formatData";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class ScheduleLogDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ScheduleLogModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListScheduleLog({
    page,
    pageSize,
    searchText,
    sortField,
    scheduleId,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    sortField?: ISorter;
    scheduleId?: number;
  }): Promise<[IGetListResponse<IScheduleLog> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          searchText
            ? {
                [Op.or]: [
                  { "$campaign.name$": { [Op.like]: `%${searchText}%` } },
                  { "$workflow.name$": { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
          scheduleId ? { scheduleId } : {},
        ],
      };

      const totalDataAwait = ScheduleLogModel.count({
        where: !searchText ? condition : {},
      });

      const order: any[] = [
        sortField?.field === "campaignName"
          ? [
              { model: CampaignModel, as: "campaign" },
              "name",
              sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC",
            ]
          : [],
        sortField?.field === "workflowName"
          ? [
              { model: WorkflowModel, as: "workflow" },
              "name",
              sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC",
            ]
          : [],
        sortField?.field === "scheduleName"
          ? [
              { model: ScheduleModel, as: "schedule" },
              "name",
              sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC",
            ]
          : [],
        sortField?.field === "createAt"
          ? ["createAt", sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC"]
          : [],
        sortField?.field !== "createAt" ? ["createAt", "DESC"] : [],
      ].filter((pair: any[]) => pair?.length > 0);

      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = ScheduleLogModel.findAll({
        order,
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        include: [
          {
            model: CampaignModel,
            as: "campaign",
            required: false,
          },
          { model: WorkflowModel, required: false, as: "workflow" },
          { model: ScheduleModel, required: false, as: "schedule" },
        ],
        raw: false,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      let totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((item: Model<any, any>) =>
        formatScheduleLog(item),
      );

      if (searchText) {
        totalData = listData?.length;
        page = 0;
        totalPage = 1;
        pageSize = totalData;
      }

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListScheduleLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneScheduleLog(
    id: number,
  ): Promise<[IScheduleLog | null, Error | null]> {
    try {
      const data = await ScheduleLogModel.findOne({
        where: { id },
        include: [
          {
            model: CampaignModel,
            as: "campaign",
            required: false,
          },
          { model: WorkflowModel, required: false, as: "workflow" },
        ],
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [formatScheduleLog(data), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneScheduleLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createScheduleLog(
    scheduleLog: IScheduleLog,
  ): Promise<[IScheduleLog | null, Error | null]> {
    try {
      const data = await ScheduleLogModel.create(
        {
          ...scheduleLog,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          include: [
            {
              model: CampaignModel,
              as: "campaign",
              required: false,
            },
            { model: WorkflowModel, required: false, as: "workflow" },
          ],
          raw: false,
        },
      );
      return [formatScheduleLog(data), null];
    } catch (err: any) {
      logEveryWhere({ message: `createScheduleLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateScheduleLog(
    scheduleLog: IScheduleLog,
  ): Promise<[IScheduleLog | null, Error | null]> {
    try {
      await ScheduleLogModel.update(
        _.omit({ ...scheduleLog, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: scheduleLog?.id },
        },
      );

      return this.getOneScheduleLog(scheduleLog?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateScheduleLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteScheduleLog(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ScheduleLogModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteScheduleLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteScheduleLogCron(minTimestamp: number): Promise<boolean> {
    try {
      await ScheduleLogModel.destroy({
        where: literal(`ScheduleLogs.createAt < ${minTimestamp}`),
      });
      return true;
    } catch (err: any) {
      logEveryWhere({
        message: `deleteScheduleLogCron() error: ${err?.message}`,
      });
      return false;
    }
  }

  async getRetryingLogs(nowMs: number): Promise<IScheduleLog[]> {
    try {
      const data: any[] = await ScheduleLogModel.findAll({
        where: {
          status: AgentScheduleStatus.RETRYING,
          nextRetryAt: { [Op.lte]: nowMs },
        },
        raw: false,
      });
      return data.map((item) => formatScheduleLog(item));
    } catch (err: any) {
      logEveryWhere({
        message: `getRetryingLogs() error: ${err?.message}`,
      });
      return [];
    }
  }

  async getLatestJobLog(
    scheduleId: number,
    jobId: number,
  ): Promise<IScheduleLog | null> {
    try {
      const data = await ScheduleLogModel.findOne({
        where: { scheduleId, jobId, status: AgentScheduleStatus.SUCCESS },
        order: [["createAt", "DESC"]],
        raw: false,
      });
      if (!data) {
        return null;
      }
      return formatScheduleLog(data);
    } catch (err: any) {
      logEveryWhere({
        message: `getLatestJobLog() error: ${err?.message}`,
      });
      return null;
    }
  }
}

const scheduleLogDB = new ScheduleLogDB();
export { scheduleLogDB };
