import { literal, Model, Op } from "sequelize";
import _ from "lodash";
import { ILog, IGetListResponse } from "@/electron/type";
import { CampaignModel, UserLogModel, WorkflowModel } from "./index";
import { formatLog } from "@/electron/service/formatData";
import { logEveryWhere } from "@/electron/service/util";

class UserLogDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await UserLogModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListUserLog({
    page,
    pageSize,
    searchText,
    campaignId,
    workflowId,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    campaignId?: number;
    workflowId?: number;
  }): Promise<[IGetListResponse<ILog> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          campaignId ? { campaignId } : {},
          workflowId ? { workflowId } : {},
          searchText
            ? {
                [Op.or]: [{ content: { [Op.like]: `%${searchText}%` } }],
              }
            : {},
        ],
      };

      const totalDataAwait = UserLogModel.count({
        where: !searchText ? condition : {},
      });
      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = UserLogModel.findAll({
        order: [["createAt", "DESC"]],
        ...(searchText ? {} : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        include: [
          {
            model: WorkflowModel,
            as: "workflow",
            required: false,
          },
          {
            model: CampaignModel,
            as: "campaign",
            required: false,
          },
        ],
        raw: false,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      listData = listData?.map((item: Model<any, any>) => formatLog(item));
      let totalPage = Math.ceil(totalData / Number(pageSize));

      if (searchText) {
        totalData = listData?.length;
        page = 0;
        totalPage = 1;
        pageSize = totalData;
      }

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListUserLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneUserLog(id: number): Promise<[ILog | null, Error | null]> {
    try {
      const data = await UserLogModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneUserLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createUserLog(data: ILog): Promise<[ILog | null, Error | null]> {
    try {
      const label = await UserLogModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );

      return [label?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createUserLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateUserLog(label: ILog): Promise<[ILog | null, Error | null]> {
    try {
      await UserLogModel.update(
        _.omit({ ...label, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: label?.id },
        },
      );

      return this.getOneUserLog(label?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateUserLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteUserLog(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await UserLogModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteUserLog() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteUserLogCron(minTimestamp: number): Promise<boolean> {
    try {
      await UserLogModel.destroy({
        where: literal(`UserLogs.createAt < ${minTimestamp}`),
      });
      return true;
    } catch (err: any) {
      logEveryWhere({ message: `deleteUserLogCron() error: ${err?.message}` });
      return false;
    }
  }
}

const userLogDB = new UserLogDB();
export { userLogDB };
