import { Op, Sequelize } from "sequelize";
import _ from "lodash";
import { ProxyIpModel } from "./index";
import { IProxyIp, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

class ProxyIpDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ProxyIpModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListProxyIp(
    page: number,
    pageSize: number,
    searchText?: string,
    groupId?: number,
  ): Promise<[IGetListResponse<IProxyIp> | null, Error | null]> {
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
      const totalDataAwait = ProxyIpModel.count({
        where: !searchText ? condition : {},
      });
      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = ProxyIpModel.findAll({
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
      logEveryWhere({ message: `getListProxyIp() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListProxyIpInGroup(
    groupId: number,
  ): Promise<[IProxyIp[], Error | null]> {
    try {
      const data: any = await ProxyIpModel.findAll({
        where: { groupId },
        raw: true,
      });

      if (!data) {
        return [[], null];
      }
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListProxyIpInGroup() error: ${err?.message}` });
      return [[], err];
    }
  }

  async getOneProxyIp(id: number): Promise<[IProxyIp | null, Error | null]> {
    try {
      const data = await ProxyIpModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneProxyIp() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createProxyIp(
    data: IProxyIp,
  ): Promise<[IProxyIp | null, Error | null]> {
    try {
      const proxyIp = await ProxyIpModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          raw: false,
        },
      );

      return [proxyIp?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createProxyIp() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkProxyIp(listProxyIp: IProxyIp[]): Promise<Error | null> {
    try {
      await ProxyIpModel.bulkCreate(
        listProxyIp?.map((proxyIp: IProxyIp) => ({
          ...proxyIp,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        })),
        { ignoreDuplicates: true },
      );

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `createBulkProxyIp() error: ${err?.message}` });
      return err;
    }
  }

  async updateProxyIp(
    data: IProxyIp,
  ): Promise<[IProxyIp | null, Error | null]> {
    try {
      await ProxyIpModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneProxyIp(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateProxyIp() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProxyIp(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ProxyIpModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteProxyIp() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProxyIpInGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ProxyIpModel.destroy({
        where: { groupId: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteProxyIpInGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async countTotalProxyIp(
    listGroupID: number[],
  ): Promise<[any[], Error | null]> {
    try {
      const data = await ProxyIpModel.findAll({
        group: ["groupId"],
        attributes: ["groupId", [Sequelize.fn("COUNT", "groupId"), "count"]],
        where: { groupId: { [Op.in]: listGroupID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `countTotalProxyIp() error: ${err?.message}` });
      return [[], err];
    }
  }
}

const proxyIpDB = new ProxyIpDB();
export { proxyIpDB };
