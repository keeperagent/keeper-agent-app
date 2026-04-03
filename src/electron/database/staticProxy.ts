import { Op, Sequelize } from "sequelize";
import _ from "lodash";
import { StaticProxyModel } from "./index";
import { IStaticProxy, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

class StaticProxyDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await StaticProxyModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListStaticProxy(
    page: number,
    pageSize: number,
    searchText?: string,
    groupId?: number,
  ): Promise<[IGetListResponse<IStaticProxy> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          groupId ? { groupId } : {},
          searchText
            ? {
                [Op.or]: [
                  { ip: { [Op.like]: `%${searchText}%` } },
                  { port: { [Op.like]: `%${searchText}%` } },
                  { protocol: { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
        ],
      };
      const totalDataAwait = StaticProxyModel.count({
        where: !searchText ? condition : {},
      });
      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = StaticProxyModel.findAll({
        order: [["updateAt", "DESC"]],
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        raw: true,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      let totalPage = Math.ceil(totalData / Number(pageSize));

      if (searchText) {
        totalData = listData?.length;
        page = 0;
        totalPage = 1;
        pageSize = totalData;
      }

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListStaticProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListStaticProxyInGroup(
    groupId: number,
  ): Promise<[IStaticProxy[], Error | null]> {
    try {
      const data: any = await StaticProxyModel.findAll({
        where: { groupId },
        raw: true,
      });

      if (!data) {
        return [[], null];
      }
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListStaticProxyInGroup() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getOneStaticProxy(
    id: number,
  ): Promise<[IStaticProxy | null, Error | null]> {
    try {
      const data = await StaticProxyModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneStaticProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createStaticProxy(
    data: IStaticProxy,
  ): Promise<[IStaticProxy | null, Error | null]> {
    try {
      const staticProxy = await StaticProxyModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          raw: false,
        },
      );

      return [staticProxy?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createStaticProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkStaticProxy(
    listStaticProxy: IStaticProxy[],
  ): Promise<Error | null> {
    try {
      await StaticProxyModel.bulkCreate(
        listStaticProxy?.map((staticProxy: IStaticProxy) => ({
          ...staticProxy,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        })),
        { ignoreDuplicates: true },
      );

      return null;
    } catch (err: any) {
      logEveryWhere({
        message: `createBulkStaticProxy() error: ${err?.message}`,
      });
      return err;
    }
  }

  async updateStaticProxy(
    data: IStaticProxy,
  ): Promise<[IStaticProxy | null, Error | null]> {
    try {
      await StaticProxyModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneStaticProxy(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateStaticProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteStaticProxy(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await StaticProxyModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteStaticProxy() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteStaticProxyInGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await StaticProxyModel.destroy({
        where: { groupId: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteStaticProxyInGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async countTotalStaticProxy(
    listGroupID: number[],
  ): Promise<[any[], Error | null]> {
    try {
      const data = await StaticProxyModel.findAll({
        group: ["groupId"],
        attributes: ["groupId", [Sequelize.fn("COUNT", "groupId"), "count"]],
        where: { groupId: { [Op.in]: listGroupID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `countTotalStaticProxy() error: ${err?.message}`,
      });
      return [[], err];
    }
  }
}

const staticProxyDB = new StaticProxyDB();
export { staticProxyDB };
