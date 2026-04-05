import { Op, Model, Sequelize } from "sequelize";
import _ from "lodash";
import { IProfile, IGetListResponse } from "@/electron/type";
import { formatProfile } from "@/electron/service/formatData";
import { ProfileModel, WalletModel, ResourceModel } from "./index";
import { logEveryWhere, searchProfile } from "@/electron/service/util";

class ProfileDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await ProfileModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getAllProfileOfGroup(
    groupId: number,
  ): Promise<[IProfile[] | null, Error | null]> {
    try {
      let listData: any[] = await ProfileModel.findAll({
        where: {
          groupId,
        },
        include: [
          {
            model: WalletModel,
            as: "wallet",
            required: false,
          },
          { model: ResourceModel, required: false },
        ],
        raw: false,
      });
      listData = listData?.map((item: Model<any, any>) => formatProfile(item));
      return [listData || [], null];
    } catch (err: any) {
      logEveryWhere({
        message: `getAllProfileOfGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getListProfile(
    page: number,
    pageSize: number,
    searchText?: string,
    groupId?: number,
    encryptKey?: string,
  ): Promise<[IGetListResponse<IProfile> | null, Error | null]> {
    try {
      const isSearchInDatabase = searchText && !encryptKey;
      const isSearchManualy = searchText && encryptKey;
      const condition = {
        [Op.and]: [
          groupId ? { groupId } : {},
          isSearchInDatabase
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${searchText}%` } },
                  { note: { [Op.like]: `%${searchText}%` } },
                  { "$wallet.address$": { [Op.like]: `%${searchText}%` } },
                  { "$wallet.phrase$": { [Op.like]: `%${searchText}%` } },
                  { "$wallet.privateKey$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col1$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col2$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col3$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col4$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col5$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col6$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col7$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col8$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col9$": { [Op.like]: `%${searchText}%` } },
                  { "$Resources.col10$": { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
        ],
      };
      const totalDataAwait = ProfileModel.count({
        where: !searchText ? condition : {},
      });
      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = ProfileModel.findAll({
        order: [
          searchText ? ["name", "ASC"] : [],
          !searchText ? ["updateAt", "DESC"] : [],
        ].filter((pair) => pair?.length > 0) as [string, string][],
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        include: [
          {
            model: WalletModel,
            as: "wallet",
            required: false,
          },
          { model: ResourceModel, required: false },
        ],
        where: condition,
        raw: false,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      let totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((item: Model<any, any>) => formatProfile(item));

      if (isSearchManualy) {
        listData = searchProfile(listData, encryptKey || "", searchText);
      }

      if (searchText) {
        totalData = listData?.length;
        page = 0;
        totalPage = 1;
        pageSize = totalData;
      }

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListProfile() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneProfile(id: number): Promise<[IProfile | null, Error | null]> {
    try {
      const data = await ProfileModel.findOne({
        where: { id },
        include: [
          { model: WalletModel, as: "wallet", required: false },
          { model: ResourceModel, required: false },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [formatProfile(data), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneProfile() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createProfile(
    data: IProfile,
    ignoreDuplicates?: boolean,
  ): Promise<[IProfile | null, Error | null]> {
    try {
      const profile = await ProfileModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          include: [
            { model: WalletModel, as: "wallet", required: true },
            { model: ResourceModel, required: false },
          ],
          raw: false,
          ignoreDuplicates: Boolean(ignoreDuplicates),
        },
      );

      // add to junction table
      // @ts-ignore
      await profile.setResources(data?.listResourceId);

      return [formatProfile(profile), null];
    } catch (err: any) {
      logEveryWhere({ message: `createProfile() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkProfile(listProfile: IProfile[]): Promise<Error | null> {
    try {
      for (let i = 0; i < listProfile.length; i++) {
        await this.createProfile(listProfile[i], true);
      }

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `createBulkProfile() error: ${err?.message}` });
      return err;
    }
  }

  async updateProfile(
    data: IProfile,
  ): Promise<[IProfile | null, Error | null]> {
    try {
      await ProfileModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: data?.id },
        },
      );

      if (data?.listResourceId) {
        const campaignObject = await ProfileModel.findByPk(data?.id);
        // @ts-ignore
        await campaignObject.setResources(data?.listResourceId);
      }

      return await this.getOneProfile(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateProfile() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProfile(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ProfileModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteProfile() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteProfileInGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await ProfileModel.destroy({
        where: { groupId: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteProfileInGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async countTotalProfile(
    listGroupID: number[],
  ): Promise<[any[], Error | null]> {
    try {
      const data = await ProfileModel.findAll({
        group: ["groupId"],
        attributes: ["groupId", [Sequelize.fn("COUNT", "groupId"), "count"]],
        where: { groupId: { [Op.in]: listGroupID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `countTotalProfile() error: ${err?.message}` });
      return [[], err];
    }
  }
}

const profileDB = new ProfileDB();
export { profileDB };
