import { Op } from "sequelize";
import { WalletActivityModel } from "./index";
import { IWalletActivity, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

class WalletActivityDB {
  async getListWalletActivity(
    page: number,
    pageSize: number,
    walletAddress?: string,
    walletGroupId?: number,
    searchText?: string,
  ): Promise<[IGetListResponse<IWalletActivity> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          walletAddress ? { walletAddress } : {},
          walletGroupId ? { walletGroupId } : {},
          searchText
            ? {
                [Op.or]: [
                  { walletAddress: { [Op.like]: `%${searchText}%` } },
                  { txHash: { [Op.like]: `%${searchText}%` } },
                  { token0Symbol: { [Op.like]: `%${searchText}%` } },
                  { token1Symbol: { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
        ],
      };

      const totalDataAwait = WalletActivityModel.count({ where: condition });
      const listDataAwait = WalletActivityModel.findAll({
        order: [["createAt", "DESC"]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        raw: true,
      });

      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const totalPage = Math.ceil(totalData / Number(pageSize));

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListWalletActivity() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createWalletActivity(
    data: IWalletActivity,
  ): Promise<[IWalletActivity | null, Error | null]> {
    try {
      const activity = await WalletActivityModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );

      return [activity?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createWalletActivity() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

const walletActivityDB = new WalletActivityDB();
export { walletActivityDB };
