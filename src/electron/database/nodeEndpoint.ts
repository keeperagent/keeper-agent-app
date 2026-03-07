import { Op, Sequelize } from "sequelize";
import _ from "lodash";
import { INodeEndpoint, IGetListResponse } from "@/electron/type";
import { NodeEndpointModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";

class NodeEndpointDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await NodeEndpointModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListNodeEndpoint(
    page: number,
    pageSize: number,
    searchText?: string,
    groupId?: number,
  ): Promise<[IGetListResponse<INodeEndpoint> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          groupId ? { groupId } : {},
          searchText
            ? {
                [Op.or]: [{ endpoint: { [Op.like]: `%${searchText}%` } }],
              }
            : {},
        ],
      };
      const totalDataAwait = NodeEndpointModel.count({
        where: !searchText ? condition : {},
      });
      pageSize = !searchText ? pageSize : 5000;
      const listDataAwait = NodeEndpointModel.findAll(
        _.omit(
          {
            order: [["updateAt", "DESC"]],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            where: condition,
            raw: true,
          },
          searchText ? ["limit"] : [""], // can not use @limit in some case. Reference: https://github.com/sequelize/sequelize/issues/12971
        ),
      );

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      totalData = !searchText ? totalData : listData.length;
      const totalPage = Math.ceil(totalData / Number(pageSize));

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListNodeEndpoint() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListNodeEndpointByGroupId(
    groupId: number,
  ): Promise<[INodeEndpoint[] | null, Error | null]> {
    try {
      const listData: any = await NodeEndpointModel.findAll({
        order: [["updateAt", "DESC"]],
        where: { groupId },
        raw: true,
      });

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListNodeEndpointByGroupId() error: ${err?.message}` });
      return [[], err];
    }
  }

  async getOneNodeEndpoint(
    id: number,
  ): Promise<[INodeEndpoint | null, Error | null]> {
    try {
      const data = await NodeEndpointModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneNodeEndpoint() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createNodeEndpoint(
    data: INodeEndpoint,
  ): Promise<[INodeEndpoint | null, Error | null]> {
    try {
      const profile = await NodeEndpointModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          raw: false,
        },
      );

      return [profile?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createNodeEndpoint() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkNodeEndpoint(
    listNodeEndpoint: INodeEndpoint[],
  ): Promise<Error | null> {
    try {
      await NodeEndpointModel.bulkCreate(
        listNodeEndpoint?.map((proxyIp: INodeEndpoint) => ({
          ...proxyIp,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        })),
        { ignoreDuplicates: true },
      );

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `createBulkNodeEndpoint() error: ${err?.message}` });
      return err;
    }
  }

  async updateNodeEndpoint(
    data: INodeEndpoint,
  ): Promise<[INodeEndpoint | null, Error | null]> {
    try {
      await NodeEndpointModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneNodeEndpoint(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateNodeEndpoint() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteNodeEndpoint(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await NodeEndpointModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteNodeEndpoint() error: ${err?.message}` });
      return [null, err];
    }
  }

  async countTotalNodeEndpoint(
    listGroupID: number[],
  ): Promise<[any[], Error | null]> {
    try {
      const data = await NodeEndpointModel.findAll({
        group: ["groupId"],
        attributes: ["groupId", [Sequelize.fn("COUNT", "groupId"), "count"]],
        where: { groupId: { [Op.in]: listGroupID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `countTotalNodeEndpoint() error: ${err?.message}` });
      return [[], err];
    }
  }
}

const nodeEndpointDB = new NodeEndpointDB();
export { nodeEndpointDB };
