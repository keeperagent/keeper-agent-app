import { Op } from "sequelize";
import _ from "lodash";
import { IGetListResponse } from "@/electron/type";
import { IExtension } from "@/electron/type";
import { ExtensionModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";

class ExtensionDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ExtensionModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListExtension(
    searchText?: string,
  ): Promise<[IGetListResponse<IExtension> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: searchText
          ? {
              [Op.or]: [
                { name: { [Op.like]: `%${searchText}%` } },
                { description: { [Op.like]: `%${searchText}%` } },
              ],
            }
          : {},
      };
      const listData: any[] = await ExtensionModel.findAll({
        order: [["updateAt", "DESC"]],
        where: condition,
        raw: true,
      });

      return [
        {
          data: listData,
          totalData: listData?.length,
          page: 0,
          pageSize: listData?.length,
          totalPage: 1,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({ message: `getListExtension() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListExtensionByName(
    listExtensionName: string[],
  ): Promise<[any, Error | null]> {
    try {
      const result: { [key: string]: string } = {};

      for (let i = 0; i < listExtensionName?.length; i++) {
        const searchKey = listExtensionName[i];
        const data: any = await ExtensionModel.findOne({
          where: { name: { [Op.like]: `%${searchKey?.toLowerCase()}%` } },
          raw: true,
        });

        if (data) {
          result[searchKey] = (data as IExtension)?.extensionId || "";
        }
      }

      return [result, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListExtensionByName() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListExtensionById(
    listID: number[],
  ): Promise<[IExtension[], Error | null]> {
    try {
      const listData: any = await ExtensionModel.findAll({
        where: { id: { [Op.in]: listID } },
        raw: true,
      });

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListExtensionById() error: ${err?.message}` });
      return [[], err];
    }
  }

  async getOneExtension(id: number): Promise<[IExtension | null, null]> {
    try {
      const data = await ExtensionModel.findOne({ where: { id }, raw: false });
      if (!data) {
        return [null, null];
      }
      return [data.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneExtension() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createExtension(
    extension: IExtension,
  ): Promise<[IExtension | null, Error | null]> {
    try {
      const data = await ExtensionModel.create(
        {
          ...extension,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createExtension error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateExtension(
    extension: IExtension,
  ): Promise<[IExtension | null, Error | null]> {
    try {
      await ExtensionModel.update(
        _.omit({ ...extension, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: extension?.id },
        },
      );

      const [data] = await this.getOneExtension(extension?.id!);
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `updateExtension() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteExtension(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ExtensionModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteExtension() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const extensionDB = new ExtensionDB();
export { extensionDB };
