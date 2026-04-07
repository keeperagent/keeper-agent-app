import { Op, Sequelize } from "sequelize";
import _ from "lodash";
import { ResourceGroupModel, ResourceModel } from "./index";
import { IResource, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { decryptResource } from "@/electron/service/resource";

class ResourceDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ResourceModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListResource({
    page,
    pageSize,
    searchText,
    groupId,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    groupId?: number;
  }): Promise<[IGetListResponse<IResource> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          searchText
            ? {
                [Op.or]: [
                  { col1: { [Op.like]: `%${searchText}%` } },
                  { col2: { [Op.like]: `%${searchText}%` } },
                  { col3: { [Op.like]: `%${searchText}%` } },
                  { col4: { [Op.like]: `%${searchText}%` } },
                  { col5: { [Op.like]: `%${searchText}%` } },
                  { col6: { [Op.like]: `%${searchText}%` } },
                  { col7: { [Op.like]: `%${searchText}%` } },
                  { col8: { [Op.like]: `%${searchText}%` } },
                  { col9: { [Op.like]: `%${searchText}%` } },
                  { col10: { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
          groupId ? { groupId } : {},
        ],
      };
      const totalDataAwait = ResourceModel.count({ where: condition });
      const listDataAwait = ResourceModel.findAll({
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
      const totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((resource: IResource) => ({
        ...resource,
        isOriginalEncrypted: resource?.isEncrypted,
      }));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListResource() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListResourceById(
    listID: number[],
  ): Promise<[IResource[], Error | null]> {
    try {
      const listData: any = await ResourceModel.findAll({
        where: { id: { [Op.in]: listID } },
        include: [{ model: ResourceGroupModel, as: "group" }],
        raw: true,
      });

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListResourceById() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async findResource(
    resource: IResource,
    fieldToSearch: string,
    encryptKey?: string,
  ): Promise<[IResource | null, Error | null]> {
    try {
      if (!encryptKey) {
        const data = await ResourceModel.findOne({
          where: { ...resource },
          raw: false,
        });
        if (!data) {
          return [null, null];
        }
        return [data?.toJSON(), null];
      }

      let allResource: any[] = await ResourceModel.findAll({
        raw: true,
      });

      allResource = allResource?.map((item: IResource) =>
        decryptResource(item, encryptKey),
      );

      const data = allResource?.find(
        (item: any) => item[fieldToSearch] === (resource as any)[fieldToSearch],
      );

      return [data || null, null];
    } catch (err: any) {
      logEveryWhere({ message: `findResource() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneResource(id: number): Promise<[IResource | null, Error | null]> {
    try {
      const data = await ResourceModel.findOne({ where: { id }, raw: false });
      if (!data) {
        return [null, null];
      }
      return [data.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneResource() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkResource(listResource: IResource[]): Promise<Error | null> {
    try {
      await ResourceModel.bulkCreate(
        listResource?.map((resource: IResource) => ({
          ...resource,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        })),
        { ignoreDuplicates: true },
      );

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `createBulkResource() error: ${err?.message}` });
      return err;
    }
  }

  async createResource(
    resource: IResource,
  ): Promise<[IResource | null, Error | null]> {
    try {
      const data = await ResourceModel.create(
        {
          ...resource,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createResource() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateResource(
    group: IResource,
  ): Promise<[IResource | null, Error | null]> {
    try {
      await ResourceModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneResource(group?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateResource() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteResource(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ResourceModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteResource() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteResourceInGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ResourceModel.destroy({
        where: { groupId: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteResourceInGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async countTotalResource(
    listGroupID: number[],
  ): Promise<[any[], Error | null]> {
    try {
      const data = await ResourceModel.findAll({
        group: ["groupId"],
        attributes: ["groupId", [Sequelize.fn("COUNT", "groupId"), "count"]],
        where: { groupId: { [Op.in]: listGroupID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `countTotalResource() error: ${err?.message}` });
      return [[], err];
    }
  }
}

const resourceDB = new ResourceDB();
export { resourceDB };
