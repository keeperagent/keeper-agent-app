import { Op } from "sequelize";
import _ from "lodash";
import { ISetting, IGetListResponse, ISorter } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { formatSetting } from "@/electron/service/formatData";
import { SORT_ORDER } from "@/electron/constant";
import { SettingModel } from "./index";

class SettingDB {
  async getListSetting(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
    type?: string,
  ): Promise<[IGetListResponse<ISetting> | null, Error | null]> {
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

      const totalDataAwait = SettingModel.count({
        where: condition,
      });
      const listDataAwait = SettingModel.findAll({
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
          data: listData.map((item: any) => formatSetting(item)),
          totalData,
          page,
          pageSize,
          totalPage,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `getListSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneSetting(id: number): Promise<[ISetting | null, Error | null]> {
    try {
      const data = await SettingModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [formatSetting(data), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createSetting(
    data: Partial<ISetting>,
  ): Promise<[ISetting | null, Error | null]> {
    try {
      const agentSetting = await SettingModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        {
          raw: false,
        },
      );

      return [formatSetting(agentSetting), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateSetting(
    data: ISetting,
  ): Promise<[ISetting | null, Error | null]> {
    try {
      await SettingModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]) as any,
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneSetting(data?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteSetting(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await SettingModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteSetting() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

const settingDB = new SettingDB();
export { settingDB };
