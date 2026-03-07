import { Op, Sequelize } from "sequelize";
import _ from "lodash";
import { WalletGroupModel, WalletModel } from "./index";
import { IWallet, IGetListResponse, ISorter } from "@/electron/type";
import { logEveryWhere, searchWallet } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class WalletDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await WalletModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListWallet({
    page,
    pageSize,
    searchText,
    groupId,
    encryptKey,
    sortField,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    groupId?: number;
    encryptKey?: string;
    sortField?: ISorter;
  }): Promise<[IGetListResponse<IWallet> | null, Error | null]> {
    try {
      const isSearchInDatabase = searchText && !encryptKey;
      const isSearchManualy = searchText && encryptKey;
      const condition = {
        [Op.and]: [
          isSearchInDatabase
            ? {
                [Op.or]: [
                  { address: { [Op.like]: `%${searchText}%` } },
                  { phrase: { [Op.like]: `%${searchText}%` } },
                  { privateKey: { [Op.like]: `%${searchText}%` } },
                  { note: { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
          groupId ? { groupId } : {},
        ],
      };
      let order: any[] = [
        ["index", "ASC"],
        ["updateAt", "DESC"],
      ];
      const fieldName = sortField?.field || "";
      if (fieldName !== "") {
        order = [
          [fieldName, sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC"],
          ["index", "ASC"],
          ["updateAt", "DESC"],
        ];
      }

      const totalDataAwait = WalletModel.count({ where: condition });
      const listDataAwait = WalletModel.findAll(
        _.omit(
          {
            order,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            where: condition,
            include: { model: WalletGroupModel, as: "group" },
            raw: true,
          },
          isSearchManualy ? ["limit", "offset"] : [],
        ),
      );

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      let totalPage = Math.ceil(totalData / Number(pageSize));

      if (isSearchManualy) {
        listData = searchWallet(listData, encryptKey || "", searchText);
        totalData = listData?.length;
        page = 0;
        totalPage = 1;
        pageSize = totalData;
      }
      listData = listData?.map((wallet: IWallet) => ({
        ...wallet,
        isOriginalEncrypted: wallet?.isEncrypted,
      }));

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListWallet() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListWalletById(
    listID: number[],
  ): Promise<[IWallet[], Error | null]> {
    try {
      const listData: any = await WalletModel.findAll({
        where: { id: { [Op.in]: listID } },
        raw: false,
      });

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListWalletById() error: ${err?.message}` });
      return [[], err];
    }
  }

  async getOneWallet(id: number): Promise<[IWallet | null, Error | null]> {
    try {
      const data = await WalletModel.findOne({
        where: { id },
        include: { model: WalletGroupModel, as: "group" },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneWallet() error: ${err?.message}` });
      return [null, err];
    }
  }

  async findWallet(
    wallet: IWallet,
    encryptKey?: string,
  ): Promise<[IWallet | null, Error | null]> {
    try {
      if (!encryptKey) {
        const data = await WalletModel.findOne({
          where: { ...wallet },
          raw: false,
        });
        if (!data) {
          return [null, null];
        }
        return [data?.toJSON(), null];
      }

      const allWallet: any[] = await WalletModel.findAll({
        raw: true,
      });

      const results = searchWallet(
        allWallet,
        encryptKey || "",
        wallet?.phrase || wallet?.address || wallet?.privateKey || "",
      );
      if (results?.length > 0) {
        return [results[0], null];
      }

      return [null, null];
    } catch (err: any) {
      logEveryWhere({ message: `findWallet() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkWallet(listWallet: IWallet[]): Promise<Error | null> {
    try {
      await WalletModel.bulkCreate(
        listWallet?.map((wallet: IWallet) => ({
          ...wallet,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        })),
        { ignoreDuplicates: true },
      );

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `createBulkWallet() error: ${err?.message}` });
      return err;
    }
  }

  async createWallet(wallet: IWallet): Promise<[IWallet | null, Error | null]> {
    try {
      const data = await WalletModel.create(
        {
          ...wallet,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createWallet() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateWallet(wallet: IWallet): Promise<[IWallet | null, Error | null]> {
    try {
      await WalletModel.update(
        _.omit({ ...wallet, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: wallet?.id },
        },
      );

      return this.getOneWallet(wallet?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateWallet() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteWallet(listID: number[]): Promise<[number | null, Error | null]> {
    try {
      const data = await WalletModel.destroy({
        where: { id: listID },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteWallet() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteWalletInGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await WalletModel.destroy({
        where: { groupId: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteWalletInGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async countTotalWallet(
    listGroupID: number[],
  ): Promise<[any[], Error | null]> {
    try {
      const data = await WalletModel.findAll({
        group: ["groupId"],
        attributes: ["groupId", [Sequelize.fn("COUNT", "groupId"), "count"]],
        where: { groupId: { [Op.in]: listGroupID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `countTotalWallet() error: ${err?.message}` });
      return [[], err];
    }
  }
}

const walletDB = new WalletDB();
export { walletDB };
