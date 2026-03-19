import { Op, Sequelize, Model } from "sequelize";
import _ from "lodash";
import {
  ICampaign,
  ICampaignProfile,
  IGetListResponse,
  ISorter,
} from "@/electron/type";
import { formatCampaignProfile } from "@/electron/service/formatData";
import {
  CampaignModel,
  CampaignProfileModel,
  ProxyIpModel,
  ResourceGroupModel,
  ResourceModel,
  WalletGroupModel,
  WalletModel,
} from "./index";
import {
  NUMBER_OF_COLUMN,
  PROFILE_TYPE,
  SORT_ORDER,
} from "@/electron/constant";
import { logEveryWhere, searchProfile } from "@/electron/service/util";
import { getProfilePath } from "@/electron/simulator/util";
import { campaignDB } from "./campaign";

class CampaignProfileDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await CampaignProfileModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getAllProfileOfCampaign(
    campaignId: number,
    onlyActive?: boolean,
  ): Promise<[ICampaignProfile[] | null, Error | null]> {
    try {
      let listData: any[] = await CampaignProfileModel.findAll({
        where: {
          campaignId,
          ...(onlyActive ? { isActive: true } : {}),
        },
        include: [
          { model: ResourceModel, required: false },
          { model: WalletModel, as: "wallet", required: false },
          { model: ProxyIpModel, as: "proxyIp", required: false },
        ],
        raw: false,
      });
      listData = listData?.map((item: any) => formatCampaignProfile(item));
      return [listData || [], null];
    } catch (err: any) {
      logEveryWhere({
        message: `getAllProfileOfCampaign() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getListCampaignProfile({
    page,
    pageSize,
    searchText,
    campaignId,
    isRunning,
    numberOfRound,
    listId = [],
    isActive,
    encryptKey,
    sortField,
  }: {
    page: number;
    pageSize: number;
    searchText?: string;
    campaignId?: number;
    isRunning?: boolean;
    numberOfRound?: number;
    listId?: number[];
    isActive?: boolean;
    encryptKey?: string;
    sortField?: ISorter;
  }): Promise<[IGetListResponse<ICampaignProfile> | null, Error | null]> {
    try {
      const isSortSubColumn = Array.from(
        { length: NUMBER_OF_COLUMN },
        (_, i) => `col${i + 1}Value`,
      ).includes(sortField?.field || "");

      const isSearchInDatabase = searchText && !encryptKey;
      const isSearchManualy = searchText && encryptKey;
      const condition = {
        [Op.and]: [
          campaignId !== undefined ? { campaignId } : {},
          isRunning !== undefined ? { isRunning } : {},
          isActive !== undefined ? { isActive } : {},
          numberOfRound !== undefined
            ? { round: { [Op.lt]: numberOfRound } }
            : {},
          listId?.length > 0 ? { id: { [Op.in]: listId } } : {},
          isSearchInDatabase
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${searchText}%` } },
                  { note: { [Op.like]: `%${searchText}%` } },
                  { "$wallet.address$": { [Op.like]: `%${searchText}%` } },
                  { "$wallet.phrase$": { [Op.like]: `%${searchText}%` } },
                  { "$wallet.privateKey$": { [Op.like]: `%${searchText}%` } },
                  ...Array.from({ length: NUMBER_OF_COLUMN }, (_, i) => ({
                    [`$Resources.col${i + 1}$`]: {
                      [Op.like]: `%${searchText}%`,
                    },
                  })),
                ],
              }
            : {},
        ],
      };
      const totalDataAwait = CampaignProfileModel.count({
        where: !searchText ? condition : {},
      });

      const sortOrder = sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC";
      let order: any[] = [
        searchText ? ["name", sortOrder] : [],
        !searchText ? ["isRunning", sortOrder] : [],
        !searchText ? ["isActive", sortOrder] : [],
        !searchText ? ["round", sortOrder] : [],
        !searchText ? ["updateAt", sortOrder] : [],
        sortField?.field === "color" ? ["color", sortOrder] : [],
      ]?.filter((pair: string[]) => pair?.length > 0);
      const fieldName = sortField?.field || "";
      if (fieldName !== "") {
        if (isSortSubColumn) {
          order = [
            ["isActive", "DESC"],
            [
              Sequelize.literal(
                `CASE WHEN ${fieldName} NOT LIKE '*[^0-9.]*' THEN CAST(${fieldName} AS REAL) ELSE ${fieldName} END`,
              ),
              sortOrder,
            ],
          ];
        } else if (fieldName === "walletAddress") {
          order = [
            ["isActive", "DESC"],
            [{ model: WalletModel, as: "wallet" }, "address", sortOrder],
          ];
        } else {
          order = [
            ["isActive", "DESC"],
            [fieldName, sortOrder],
          ];
        }
      }
      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = CampaignProfileModel.findAll({
        order,
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        include: [
          { model: WalletModel, as: "wallet", required: false },
          { model: WalletGroupModel, as: "walletGroup", required: false },
          { model: ProxyIpModel, as: "proxyIp", required: false },
          {
            model: ResourceModel,
            required: false,
            include: [{ model: ResourceGroupModel, as: "group" }],
          },
        ],
        raw: false,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      let totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData
        ?.map((item: Model<any, any>) => formatCampaignProfile(item))
        ?.map((item: ICampaignProfile) => ({
          ...item,
          profileFolderPath: getProfilePath(item?.profileFolder || ""),
        }));

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
      logEveryWhere({
        message: `getListCampaignProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getListCampaignProfileIdByCampaign(
    campaignId: number,
  ): Promise<[number[], Error | null]> {
    try {
      let listData: any[] = await CampaignProfileModel.findAll({
        where: { campaignId },
        attributes: ["id"],
      });
      listData = listData?.map((item: any) => formatCampaignProfile(item));

      const listId: number[] = [];
      listData?.forEach((campaignProfile: ICampaignProfile) => {
        listId.push(campaignProfile?.id!);
      });
      return [listId, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListCampaignProfileIdByCampaign() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getOneCampaignProfile(
    id: number,
  ): Promise<[ICampaignProfile | null, Error | null]> {
    try {
      const data: any = await CampaignProfileModel.findOne({
        where: { id },
        include: [
          { model: WalletModel, as: "wallet", required: false },
          { model: ResourceModel, required: false },
          { model: WalletGroupModel, as: "walletGroup", required: false },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [formatCampaignProfile(data), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneCampaignProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createCampaignProfile(
    data: ICampaignProfile,
    ignoreDuplicates?: boolean,
  ): Promise<[ICampaignProfile | null, Error | null]> {
    try {
      const profile = await CampaignProfileModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          include: [
            { model: WalletModel, as: "wallet", required: false },
            { model: ResourceModel, required: false },
          ],
          raw: false,
          ignoreDuplicates: Boolean(ignoreDuplicates),
        },
      );

      // add to junction table
      // @ts-ignore
      await profile.setResources(data?.listResourceId);

      return [formatCampaignProfile(profile), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createCampaignProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createBulkCampaignProfile(
    listCampaignProfile: ICampaignProfile[],
  ): Promise<Error | null> {
    try {
      for (let i = 0; i < listCampaignProfile.length; i++) {
        await this.createCampaignProfile(listCampaignProfile[i], true);
      }

      return null;
    } catch (err: any) {
      logEveryWhere({
        message: `createBulkCampaignProfile() error: ${err?.message}`,
      });
      return err;
    }
  }

  async updateCampaignProfile(
    data: ICampaignProfile,
  ): Promise<[ICampaignProfile | null, Error | null]> {
    try {
      await CampaignProfileModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, [
          "id",
          "campaignId",
        ]),
        {
          where: { id: data?.id, campaignId: data?.campaignId },
        },
      );

      if (data?.listResourceId) {
        const campaignProfileObject = await CampaignProfileModel.findByPk(
          data?.id,
        );
        if (campaignProfileObject) {
          // @ts-ignore
          await campaignProfileObject.setResources(data?.listResourceId);
        }
      }

      return await this.getOneCampaignProfile(data?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateCampaignProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateListCampaignProfile(
    resetAll: boolean,
    listID: number[],
    profile: ICampaignProfile,
    campaignId: number,
  ): Promise<Error | null> {
    try {
      let updateValue = {};
      if (profile?.round !== undefined) {
        updateValue = {
          ...updateValue,
          round: profile?.round,
        };
      }
      if (profile?.isRunning !== undefined) {
        updateValue = {
          ...updateValue,
          isRunning: profile?.isRunning,
        };
      }

      Array.from(
        { length: NUMBER_OF_COLUMN },
        (_, i) => `col${i + 1}Value`,
      ).forEach((column: string) => {
        const columnValue = (profile as any)?.[column];
        if (columnValue !== undefined) {
          updateValue = {
            ...updateValue,
            [column]: columnValue,
          };
        }
      });

      if (profile?.isActive !== undefined) {
        updateValue = {
          ...updateValue,
          isActive: profile?.isActive,
        };
      }

      if (resetAll) {
        await CampaignProfileModel.update(updateValue, {
          where: { campaignId },
        });
      } else {
        if (listID?.length === 0) {
          return null;
        }

        await CampaignProfileModel.update(updateValue, {
          where: { id: { [Op.in]: listID }, campaignId },
        });
      }

      return null;
    } catch (err: any) {
      logEveryWhere({
        message: `updateListCampaignProfile() error: ${err?.message}`,
      });
      return err;
    }
  }

  async deleteCampaignProfile(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await CampaignProfileModel.destroy({
        where: { id: listID },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteCampaignProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteProfileInCampaign(
    listCampaignID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await CampaignProfileModel.destroy({
        where: { campaignId: { [Op.in]: listCampaignID } },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteProfileInCampaign() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async countTotalCampaignProfile(
    listCampaignID: number[],
    onlyActiveProfile: boolean,
  ): Promise<[any[], Error | null]> {
    try {
      const data = await CampaignProfileModel.findAll({
        group: ["campaignId"],
        attributes: [
          "campaignId",
          [Sequelize.fn("COUNT", "campaignId"), "count"],
        ],
        where: onlyActiveProfile
          ? { campaignId: { [Op.in]: listCampaignID }, isActive: true }
          : { campaignId: { [Op.in]: listCampaignID } },
        raw: true,
      });

      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `countTotalCampaignProfile() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getCampaignProfileStatus(
    campaignId: number,
  ): Promise<[number, number, Error | null]> {
    const [listCount, err] = await campaignProfileDB.countTotalCampaignProfile(
      [campaignId],
      true,
    );
    if (err) {
      return [0, 0, err];
    }
    const countItem = _.find(listCount, {
      campaignId,
    });
    const totalProfile = countItem?.count || 0;
    const [, totalUnFinishedProfile] =
      await this.checkCampaignProfileFinishRound(campaignId);

    return [totalProfile, totalUnFinishedProfile, null];
  }

  async checkCampaignProfileFinishRound(
    campaignId: number,
  ): Promise<[boolean, number]> {
    const [campaign] = await campaignDB.getOneCampaign(campaignId);
    const numberOfRound = campaign?.numberOfRound;

    let listCampaignProfileId: number[] = [];
    // if only select some profile to run
    if (campaign?.profileType === PROFILE_TYPE.CUSTOM_SELECT) {
      listCampaignProfileId = campaign?.listCampaignProfileId || [];
    }

    const totalRunningProfile = await CampaignProfileModel.count({
      where: {
        isRunning: true,
        isActive: true,
        campaignId,
      },
    });
    const totalUnFinishedProfile = await CampaignProfileModel.count({
      where: {
        [Op.and]: [
          { campaignId },
          listCampaignProfileId?.length > 0
            ? { id: { [Op.in]: listCampaignProfileId } }
            : {},
          {
            round: { [Op.lt]: numberOfRound },
          },
          { isActive: true },
        ],
      },
    });
    if (totalRunningProfile > 0) {
      return [false, totalUnFinishedProfile];
    }

    return [totalUnFinishedProfile === 0, totalUnFinishedProfile];
  }

  async updateActiveStatus(
    listId: number[],
    isActive: boolean,
    campaignId: number,
  ): Promise<Error | null> {
    try {
      if (listId?.length > 0) {
        await CampaignProfileModel.update(
          {
            isActive,
          },
          {
            where: { id: { [Op.in]: listId }, campaignId },
          },
        );
      } else {
        await CampaignProfileModel.update(
          {
            isActive,
          },
          {
            where: { campaignId },
          },
        );
      }
      return null;
    } catch (err: any) {
      logEveryWhere({ message: `updateActiveStatus() error: ${err?.message}` });
      return err;
    }
  }

  async getCalculatedValue(
    campaignId: number,
    listColumn: string[],
    useProvidedColumn: boolean,
  ): Promise<[string | null, Error | null]> {
    try {
      let listCampaignProfile: any[] = await CampaignProfileModel.findAll({
        where: { campaignId },
      });

      listCampaignProfile = listCampaignProfile?.map((item: Model<any, any>) =>
        formatCampaignProfile(item),
      );

      let calculatedValue = 0;
      let listColumnForCalculate: any = [];
      if (useProvidedColumn) {
        listColumnForCalculate = listColumn;
      } else {
        const [campaign, err] = await campaignDB.getOneCampaign(campaignId);
        if (err) {
          return [null, err];
        }
        if (!campaign) {
          return ["", err];
        }

        listColumnForCalculate = campaign?.listColumnForCalculate || [];
      }

      listCampaignProfile?.forEach((campaignProfile) => {
        if (!campaignProfile?.isActive) {
          return;
        }

        listColumnForCalculate?.forEach((fieldName: string) => {
          const value = campaignProfile[fieldName];
          if (isNaN(value)) {
            return;
          }

          calculatedValue += Number(value);
        });
      });
      return [calculatedValue?.toString(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getCalculatedValue() error: ${err?.message}` });
      return ["", err];
    }
  }

  getListCampaignByWalletGroupId = async (
    walletGroupId: number,
  ): Promise<[ICampaign[], Error | null]> => {
    try {
      let listCampaignProfile: any = await CampaignProfileModel.findAll({
        where: { walletGroupId },
        raw: false,
        include: [{ model: CampaignModel, as: "campaign", required: false }],
      });
      listCampaignProfile = listCampaignProfile?.map((item: Model<any, any>) =>
        formatCampaignProfile(item),
      );
      const listCampaign: ICampaign[] = [];
      const listUniqCampaignId: number[] = [];
      listCampaignProfile.forEach((campaignProfile: ICampaignProfile) => {
        if (
          !campaignProfile?.campaignId ||
          listUniqCampaignId.includes(campaignProfile?.campaignId)
        ) {
          return;
        }

        listUniqCampaignId.push(campaignProfile?.campaignId);
        listCampaign.push(campaignProfile?.campaign!);
      });

      return [listCampaign, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListCampaignByWalletGroupId() error: ${err?.message}`,
      });
      return [[], err];
    }
  };
}

const campaignProfileDB = new CampaignProfileDB();
export { campaignProfileDB, CampaignProfileModel };
