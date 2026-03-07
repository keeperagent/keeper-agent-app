import { Op } from "sequelize";
import _ from "lodash";
import { resourceDB } from "./resource";
import { ResourceGroupModel } from "./index";
import { IResourceGroup, IGetListResponse, ISorter } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class ResourceGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ResourceGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListResourceGroup(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IResourceGroup> | null, Error | null]> {
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

      const sortOrder = sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC";
      const totalDataAwait = ResourceGroupModel.count({ where: condition });
      const listDataAwait = ResourceGroupModel.findAll({
        order: [
          sortField?.field === "name" ? ["name", sortOrder] : [],
          sortField?.field === "updateAt" ? ["updateAt", sortOrder] : [],
          sortField?.field === "createAt" ? ["createAt", sortOrder] : [],
        ].filter((pair: string[]) => pair?.length > 0) as any[],
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
        listData?.map((group: IResourceGroup) => group?.id) || [];
      const [listCount] = await resourceDB.countTotalResource(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalResource: countItem?.count };
      });

      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListResourceGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListResourceGroupById(
    listID: number[],
  ): Promise<[IResourceGroup[], Error | null]> {
    try {
      let listData: any = await ResourceGroupModel.findAll({
        where: { id: { [Op.in]: listID } },
      });

      const listGroupId: number[] =
        listData?.map((group: IResourceGroup) => group?.id) || [];
      const [listCount] = await resourceDB.countTotalResource(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalResource: countItem?.count };
      });

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListResourceGroupById() error: ${err?.message}` });
      return [[], err];
    }
  }

  async getOneResourceGroup(
    id: number,
  ): Promise<[IResourceGroup | null, Error | null]> {
    try {
      const data = await ResourceGroupModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneResourceGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createResourceGroup(
    group: IResourceGroup,
  ): Promise<[IResourceGroup | null, Error | null]> {
    try {
      const data = await ResourceGroupModel.create(
        {
          ...group,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createResourceGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateResourceGroup(
    group: IResourceGroup,
  ): Promise<[IResourceGroup | null, Error | null]> {
    try {
      await ResourceGroupModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneResourceGroup(group?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateResourceGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteResourceGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ResourceGroupModel.destroy({
        where: { id: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteResourceGroup() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const resourceGroupDB = new ResourceGroupDB();
export { resourceGroupDB };
