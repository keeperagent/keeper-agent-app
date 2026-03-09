import { Op } from "sequelize";
import _ from "lodash";
import { IAgentSetting, IGetListResponse, ISorter } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";
import { AgentSettingModel } from "./index";

class AgentSettingDB {
  async getListAgentSetting(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
    type?: string,
  ): Promise<[IGetListResponse<IAgentSetting> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          type ? { type } : {},
          searchText
            ? {
                [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }],
              }
            : {},
        ],
      };
      const sortOrder = sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC";
      const orderPairs = [
        sortField?.field === "name" ? ["name", sortOrder] : [],
        sortField?.field === "createAt" ? ["createAt", sortOrder] : [],
        sortField?.field === "updateAt" ? ["updateAt", sortOrder] : [],
      ].filter((pair: string[]) => pair.length > 0) as [string, string][];
      const order =
        orderPairs.length > 0
          ? orderPairs
          : ([["createAt", "DESC"]] as [string, string][]);

      const totalDataAwait = AgentSettingModel.count({
        where: condition,
      });
      const listDataAwait = AgentSettingModel.findAll({
        order,
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        raw: true,
      });

      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const totalPage = Math.ceil(totalData / Number(pageSize));

      return [
        {
          data: listData,
          totalData,
          page,
          pageSize,
          totalPage,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `getListAgentSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneAgentSetting(
    id: number,
  ): Promise<[IAgentSetting | null, Error | null]> {
    try {
      const data = await AgentSettingModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneAgentSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createAgentSetting(
    data: Partial<IAgentSetting>,
  ): Promise<[IAgentSetting | null, Error | null]> {
    try {
      const agentSetting = await AgentSettingModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        {
          raw: false,
        },
      );

      return [agentSetting?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createAgentSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateAgentSetting(
    data: IAgentSetting,
  ): Promise<[IAgentSetting | null, Error | null]> {
    try {
      await AgentSettingModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]) as any,
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneAgentSetting(data?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateAgentSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteAgentSetting(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await AgentSettingModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteAgentSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

const agentSettingDB = new AgentSettingDB();
export { agentSettingDB };
