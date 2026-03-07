import { Op } from "sequelize";
import _ from "lodash";
import { proxyIpDB } from "./proxyIp";
import { ProxyIpGroupModel } from "./index";
import { IProxyIpGroup, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

class ProxyIpGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ProxyIpGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListProxyIpGroup(
    page: number,
    pageSize: number,
    searchText?: string,
  ): Promise<[IGetListResponse<IProxyIpGroup> | null, Error | null]> {
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
      const totalDataAwait = ProxyIpGroupModel.count({ where: condition });
      const listDataAwait = ProxyIpGroupModel.findAll({
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
        listData?.map((group: IProxyIpGroup) => group?.id) || [];
      const [listCount] = await proxyIpDB.countTotalProxyIp(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalProxyIp: countItem?.count || 0 };
      });

      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListProxyIpGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneProxyIpGroup(
    id: number,
  ): Promise<[IProxyIpGroup | null, Error | null]> {
    try {
      const data = await ProxyIpGroupModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneProxyIpGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createProxyIpGroup(
    group: IProxyIpGroup,
  ): Promise<[IProxyIpGroup | null, Error | null]> {
    try {
      const data = await ProxyIpGroupModel.create(
        {
          ...group,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createProxyIpGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateProxyIpGroup(
    group: IProxyIpGroup,
  ): Promise<[IProxyIpGroup | null, Error | null]> {
    try {
      await ProxyIpGroupModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneProxyIpGroup(group?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateProxyIpGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProxyIpGroup(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ProxyIpGroupModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteProxyIpGroup() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const proxyIpGroupDB = new ProxyIpGroupDB();
export { proxyIpGroupDB };
