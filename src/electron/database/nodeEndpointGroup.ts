import { Op } from "sequelize";
import _ from "lodash";
import { nodeEndpointDB } from "./nodeEndpoint";
import { INodeEndpointGroup, IGetListResponse } from "@/electron/type";
import { NodeEndpointGroupModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";
import { EVM_CHAIN_ID } from "@/electron/constant";

class NodeEndpointGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await NodeEndpointGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListNodeEndpointGroup(
    page: number,
    pageSize: number,
    searchText?: string,
    chainType?: string,
  ): Promise<[IGetListResponse<INodeEndpointGroup> | null, Error | null]> {
    try {
      const condition: any = {
        [Op.and]: [
          ...(searchText
            ? [
                {
                  [Op.or]: [
                    { name: { [Op.like]: `%${searchText}%` } },
                    { note: { [Op.like]: `%${searchText}%` } },
                  ],
                },
              ]
            : []),
          ...(chainType ? [{ chainType }] : []),
        ],
      };
      const totalDataAwait = NodeEndpointGroupModel.count({ where: condition });
      const listDataAwait = NodeEndpointGroupModel.findAll({
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
        listData?.map((group: INodeEndpointGroup) => group?.id) || [];
      const [listCount] =
        await nodeEndpointDB.countTotalNodeEndpoint(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalNodeEndpoint: countItem?.count || 0 };
      });

      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListNodeEndpointGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneNodeEndpointGroup(
    id: number,
  ): Promise<[INodeEndpointGroup | null, Error | null]> {
    try {
      const data: any = await NodeEndpointGroupModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }

      const nodeEndpointGroup = data?.toJSON();
      const [listCount] = await nodeEndpointDB.countTotalNodeEndpoint([
        nodeEndpointGroup?.id,
      ]);
      const countItem = _.find(listCount, {
        groupId: data?.id,
      });
      nodeEndpointGroup.totalNodeEndpoint = countItem?.count;

      return [nodeEndpointGroup, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneNodeEndpointGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createNodeEndpointGroup(
    group: INodeEndpointGroup,
  ): Promise<[INodeEndpointGroup | null, Error | null]> {
    try {
      const data = await NodeEndpointGroupModel.create(
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
        message: `createNodeEndpointGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateNodeEndpointGroup(
    group: INodeEndpointGroup,
  ): Promise<[INodeEndpointGroup | null, Error | null]> {
    try {
      await NodeEndpointGroupModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneNodeEndpointGroup(group?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateNodeEndpointGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteNodeEndpointGroup(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await NodeEndpointGroupModel.destroy({
        where: { id: listID },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteNodeEndpointGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateGroupChainId(groupId: number, chainId: number): Promise<void> {
    try {
      await NodeEndpointGroupModel.update(
        { chainId, updateAt: new Date().getTime() },
        { where: { id: groupId } },
      );
    } catch (err: any) {
      logEveryWhere({ message: `updateGroupChainId() error: ${err?.message}` });
    }
  }

  async resolveNodeEndpointGroupIdByChainKey(
    chainKey: string,
  ): Promise<number | null> {
    const chainId = EVM_CHAIN_ID[chainKey.toLowerCase()];
    if (!chainId) {
      return null;
    }

    try {
      const group: any = await NodeEndpointGroupModel.findOne({
        where: { chainId },
        raw: true,
      });
      return group?.id || null;
    } catch (err: any) {
      logEveryWhere({
        message: `resolveNodeEndpointGroupIdByChainKey() error: ${err?.message}`,
      });
      return null;
    }
  }
}

const nodeEndpointGroupDB = new NodeEndpointGroupDB();
export { nodeEndpointGroupDB };
