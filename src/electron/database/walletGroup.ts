import { Op } from "sequelize";
import _ from "lodash";
import { walletDB } from "./wallet";
import { WalletGroupModel } from "./index";
import {
  IWalletGroup,
  IGetListResponse,
  IDeleteDependency,
  ISorter,
} from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { campaignProfileDB } from "./campaignProfile";
import { profileGroupDB } from "./profileGroup";
import { SORT_ORDER } from "@/electron/constant";

class WalletGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await WalletGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListWalletGroup(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IWalletGroup> | null, Error | null]> {
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
      const totalDataAwait = WalletGroupModel.count({ where: condition });
      const listDataAwait = WalletGroupModel.findAll({
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
        listData?.map((group: IWalletGroup) => group?.id) || [];
      const [listCount] = await walletDB.countTotalWallet(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalWallet: countItem?.count || 0 };
      });

      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListWalletGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneWalletGroup(
    id: number,
  ): Promise<[IWalletGroup | null, Error | null]> {
    try {
      const data = await WalletGroupModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneWalletGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createWalletGroup(
    group: IWalletGroup,
  ): Promise<[IWalletGroup | null, Error | null]> {
    try {
      const data = await WalletGroupModel.create(
        {
          ...group,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createWalletGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateWalletGroup(
    group: IWalletGroup,
  ): Promise<[IWalletGroup | null, Error | null]> {
    try {
      await WalletGroupModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneWalletGroup(group?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateWalletGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteWalletGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await WalletGroupModel.destroy({
        where: { id: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteWalletGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  getWalletGroupDependency = async (
    listWalletGroupId: number[],
  ): Promise<[{ [key: string]: IDeleteDependency }, Error | null]> => {
    try {
      const result: { [key: string]: IDeleteDependency } = {};

      for (const walletGroupId of listWalletGroupId) {
        const [listCampaign, errCampaign] =
          await campaignProfileDB.getListCampaignByWalletGroupId(walletGroupId);
        if (errCampaign) {
          return [{}, errCampaign];
        }

        const [listProfileGroup, errProfileGroup] =
          await profileGroupDB.getListProfileGroupByWalletGroupId(
            walletGroupId,
          );
        if (errProfileGroup) {
          return [{}, errProfileGroup];
        }
        result[walletGroupId] = { listCampaign, listProfileGroup };
      }

      return [result, null];
    } catch (err: any) {
      logEveryWhere({ message: `getWalletGroupDependency() error: ${err?.message}` });
      return [{}, err];
    }
  };
}

const walletGroupDB = new WalletGroupDB();
export { walletGroupDB };
