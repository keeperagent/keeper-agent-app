import { Op } from "sequelize";
import _ from "lodash";
import { IProxy, IGetListResponse } from "@/electron/type";
import { ProxyModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";

class ProxyDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ProxyModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListProxy({
    page,
    pageSize,
    searchText,
    type,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    type?: string;
  }): Promise<[IGetListResponse<IProxy> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          searchText
            ? {
                [Op.or]: [
                  { apiKey: { [Op.like]: `%${searchText}%` } },
                  { description: { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
          type !== undefined ? { type } : {},
        ],
      };

      const totalDataAwait = ProxyModel.count({ where: condition });
      const listDataAwait = ProxyModel.findAll({
        order: [["updateAt", "DESC"]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        raw: true,
      });

      // run in parallel
      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneProxy(id: number): Promise<[IProxy | null, Error | null]> {
    try {
      const data = await ProxyModel.findOne({ where: { id }, raw: false });
      if (!data) {
        return [null, null];
      }
      return [data.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createProxy(proxy: IProxy): Promise<[IProxy | null, Error | null]> {
    try {
      const data = await ProxyModel.create(
        {
          ...proxy,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateProxy(proxy: IProxy): Promise<[IProxy | null, Error | null]> {
    try {
      await ProxyModel.update(
        _.omit({ ...proxy, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: proxy?.id },
        },
      );

      return this.getOneProxy(proxy?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProxy(listID: number[]): Promise<[number | null, Error | null]> {
    try {
      const data = await ProxyModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteProxy() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const proxyDB = new ProxyDB();
export { proxyDB };
