import { Op } from "sequelize";
import _ from "lodash";
import { staticProxyDB } from "./staticProxy";
import { StaticProxyGroupModel } from "./index";
import { IStaticProxyGroup, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

class StaticProxyGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await StaticProxyGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListStaticProxyGroup(
    page: number,
    pageSize: number,
    searchText?: string,
  ): Promise<[IGetListResponse<IStaticProxyGroup> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: searchText
          ? {
              [Op.or]: [
                { name: { [Op.like]: `%${searchText}%` } },
                { note: { [Op.like]: `%${searchText}%` } },
              ],
            }
          : {},
      };
      const totalDataAwait = StaticProxyGroupModel.count({ where: condition });
      const listDataAwait = StaticProxyGroupModel.findAll({
        order: [["updateAt", "DESC"]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        raw: true,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const listGroupId: number[] =
        listData?.map((group: IStaticProxyGroup) => group?.id) || [];
      const [listCount] =
        await staticProxyDB.countTotalStaticProxy(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalProxyIp: countItem?.count || 0 };
      });

      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListStaticProxyGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneStaticProxyGroup(
    id: number,
  ): Promise<[IStaticProxyGroup | null, Error | null]> {
    try {
      const data = await StaticProxyGroupModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneStaticProxyGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createStaticProxyGroup(
    group: IStaticProxyGroup,
  ): Promise<[IStaticProxyGroup | null, Error | null]> {
    try {
      const data = await StaticProxyGroupModel.create(
        {
          ...group,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createStaticProxyGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateStaticProxyGroup(
    group: IStaticProxyGroup,
  ): Promise<[IStaticProxyGroup | null, Error | null]> {
    try {
      await StaticProxyGroupModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneStaticProxyGroup(group?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateStaticProxyGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteStaticProxyGroup(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await StaticProxyGroupModel.destroy({
        where: { id: listID },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteStaticProxyGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

const staticProxyGroupDB = new StaticProxyGroupDB();
export { staticProxyGroupDB };
