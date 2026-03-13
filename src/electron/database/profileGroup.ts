import { Model, Op } from "sequelize";
import _ from "lodash";
import { walletDB } from "./wallet";
import {
  IProfileGroup,
  IGetListResponse,
  IResourceGroup,
  ISorter,
} from "@/electron/type";
import { resourceDB } from "./resource";
import { profileDB } from "./profile";
import { formatProfileGroup } from "@/electron/service/formatData";
import {
  ProfileGroupModel,
  WalletGroupModel,
  ResourceGroupModel,
} from "./index";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class ProfileGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ProfileGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListProfileGroup(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IProfileGroup> | null, Error | null]> {
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
      const totalDataAwait = ProfileGroupModel.count({ where: condition });
      const listDataAwait = ProfileGroupModel.findAll({
        order: [
          sortField?.field === "color" ? ["color", sortOrder] : [],
          sortField?.field === "name" ? ["name", sortOrder] : [],
          sortField?.field === "updateAt" ? ["updateAt", sortOrder] : [],
          sortField?.field === "createAt" ? ["createAt", sortOrder] : [],
        ].filter((pair: string[]) => pair?.length > 0) as any[],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        include: [
          { model: WalletGroupModel, as: "walletGroup", required: false },
          { model: ResourceGroupModel, required: false },
        ],
        raw: false,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((item: Model<any, any>) =>
        formatProfileGroup(item),
      );

      const listGroupId: number[] =
        listData?.map((group: IProfileGroup) => group?.id) || [];
      const [listCount] = await profileDB.countTotalProfile(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalProfile: countItem?.count };
      });

      // enhance data
      let listWalletGroupId: number[] = [];
      let listResourceGroupId: number[] = [];

      listData.forEach((data: IProfileGroup) => {
        listWalletGroupId = [...listWalletGroupId, data?.walletGroupId!];
        listWalletGroupId = _.uniq(listWalletGroupId);

        listResourceGroupId = [
          ...listResourceGroupId,
          ...data.listResourceGroupId!,
        ];
        listResourceGroupId = _.uniq(listResourceGroupId);
      });

      // count total resource
      const [listCountResource] =
        await resourceDB.countTotalResource(listResourceGroupId);

      // count total wallet
      const [listCountWallet] =
        await walletDB.countTotalWallet(listWalletGroupId);

      listData = listData?.map((data: IProfileGroup) => {
        const walletGroup = data?.walletGroup || {};
        const countWallet = _.find(listCountWallet, {
          groupId: walletGroup?.id,
        });
        walletGroup.totalWallet = countWallet?.count || 0;

        let listResourceGroup = data?.listResourceGroup || [];
        listResourceGroup = listResourceGroup?.map(
          (resourceGroup: IResourceGroup) => ({
            ...resourceGroup,
            totalResource:
              _.find(listCountResource, {
                groupId: resourceGroup?.id,
              })?.count || 0,
          }),
        );

        return {
          ...data,
          walletGroup,
          listResourceGroup,
        };
      });

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListProfileGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getListProfileGroupById(
    listID: number[],
  ): Promise<[IProfileGroup[], Error | null]> {
    try {
      let listData: any = await ProfileGroupModel.findAll({
        where: { id: { [Op.in]: listID } },
        include: [
          { model: WalletGroupModel, as: "walletGroup" },
          { model: ResourceGroupModel, required: false },
        ],
        raw: false,
      });
      listData = listData?.map((item: Model<any, any>) =>
        formatProfileGroup(item),
      );

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListProfileGroupById() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getOneProfileGroup(
    id: number,
  ): Promise<[IProfileGroup | null, Error | null]> {
    try {
      const data = await ProfileGroupModel.findOne({
        where: { id },
        include: [
          { model: WalletGroupModel, as: "walletGroup" },
          { model: ResourceGroupModel, required: false },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      let profileGroup = formatProfileGroup(data);

      const listGroupId: number[] = [profileGroup?.id!];
      const [listCount] = await profileDB.countTotalProfile(listGroupId);
      const countItem = _.find(listCount, {
        groupId: profileGroup?.id,
      });
      profileGroup = { ...profileGroup, totalProfile: countItem?.count };

      // enhance data
      const listWalletGroupId: number[] = profileGroup?.walletGroupId
        ? [profileGroup?.walletGroupId]
        : [];
      const listResourceGroupId: number[] =
        profileGroup?.listResourceGroupId || [];

      // count total resource
      const [listCountResource] =
        await resourceDB.countTotalResource(listResourceGroupId);

      // count total wallet
      const [listCountWallet] =
        await walletDB.countTotalWallet(listWalletGroupId);

      // get count total wallet
      const walletGroup = profileGroup?.walletGroup || {};
      const countWallet = _.find(listCountWallet, {
        groupId: walletGroup?.id,
      });
      walletGroup.totalWallet = countWallet?.count || 0;

      // get count total resource
      let listResourceGroup = profileGroup?.listResourceGroup || [];
      listResourceGroup = listResourceGroup?.map(
        (resourceGroup: IResourceGroup) => ({
          ...resourceGroup,
          totalResource:
            _.find(listCountResource, {
              groupId: resourceGroup?.id,
            })?.count || 0,
        }),
      );

      profileGroup = {
        ...profileGroup,
        walletGroup,
        listResourceGroup,
      };

      return [profileGroup, null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneProfileGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createProfileGroup(
    data: IProfileGroup,
  ): Promise<[IProfileGroup | null, Error | null]> {
    try {
      const listResourceGroupID = data?.listResourceGroupId || [];
      const profileGroup = await ProfileGroupModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          include: [
            { model: WalletGroupModel, as: "walletGroup" },
            { model: ResourceGroupModel, required: false },
          ],
          raw: false,
        },
      );

      // add to junction table
      // @ts-ignore
      await profileGroup.setResourceGroups(listResourceGroupID);

      const formatedData = formatProfileGroup(profileGroup);
      const [createdData, err] = await this.getOneProfileGroup(
        formatedData?.id!,
      );
      if (err || !createdData) {
        return [null, err];
      }

      return [createdData, null];
    } catch (err: any) {
      logEveryWhere({ message: `createProfileGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateProfileGroup(
    data: IProfileGroup,
  ): Promise<[IProfileGroup | null, Error | null]> {
    try {
      const updateData: any = {
        ...data,
        updateAt: new Date().getTime(),
      };

      await ProfileGroupModel.update(_.omit(updateData, ["id"]), {
        where: { id: data?.id },
      });

      const profileGroup = await ProfileGroupModel.findByPk(data?.id!);
      if (!profileGroup) {
        return [null, null];
      }

      if (data?.listResourceGroupId) {
        // @ts-ignore
        await profileGroup.setResourceGroups(data?.listResourceGroupId);
      }

      return await this.getOneProfileGroup(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateProfileGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProfileGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ProfileGroupModel.destroy({
        where: { id: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteProfileGroup() error: ${err?.message}` });
      return [null, err];
    }
  }

  getListProfileGroupByWalletGroupId = async (
    walletGroupId: number,
  ): Promise<[IProfileGroup[], Error | null]> => {
    try {
      let listData: any = await ProfileGroupModel.findAll({
        where: { walletGroupId },
        raw: false,
      });
      listData = listData?.map((item: Model<any, any>) =>
        formatProfileGroup(item),
      );

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListProfileGroupByWalletGroupId() error: ${err?.message}`,
      });
      return [[], err];
    }
  };
}

const profileGroupDB = new ProfileGroupDB();
export { profileGroupDB };
