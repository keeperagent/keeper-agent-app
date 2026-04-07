import { Op, Model } from "sequelize";
import _ from "lodash";
import {
  ProfileGroupModel,
  ResourceGroupModel,
  WorkflowModel,
  CampaignModel,
  StaticProxyGroupModel,
  CampaignProfileModel,
} from "./index";
import { campaignProfileDB } from "./campaignProfile";
import { ICampaign, IGetListResponse, ISorter } from "@/electron/type";
import { formatCampaign } from "@/electron/service/formatData";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class CampaignDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await CampaignModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListCampaign(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<ICampaign> | null, Error | null]> {
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
      const totalDataAwait = CampaignModel.count({ where: condition });
      const listDataAwait = CampaignModel.findAll({
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
          {
            model: ProfileGroupModel,
            as: "profileGroup",
            required: false,
          },
          {
            model: StaticProxyGroupModel,
            as: "proxyGroup",
            required: false,
          },
          { model: WorkflowModel, required: false },
          { model: CampaignProfileModel, required: false },
        ],
        raw: false,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      const totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((item: Model<any, any>) => formatCampaign(item));

      // enhance data
      const listCampaignId: number[] =
        listData?.map((campaign: ICampaign) => campaign?.id!) || [];
      const [listCount] = await campaignProfileDB.countTotalCampaignProfile(
        listCampaignId,
        false,
      );

      listData = listData?.map((campaign: ICampaign) => {
        const countItem = _.find(listCount, {
          campaignId: campaign?.id,
        });

        return {
          ...campaign,
          totalProfile: countItem?.count || 0,
        };
      });

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListCampaign() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListCampaignByWorkflowId(
    listWorkflowId: number[],
  ): Promise<[ICampaign[], Error | null]> {
    try {
      let listData: any[] = await CampaignModel.findAll({
        where: {
          "$Workflows.id$": { [Op.in]: listWorkflowId },
        },
        include: [{ model: WorkflowModel, required: false }],
        raw: false,
      });
      listData = listData?.map((item: Model<any, any>) => formatCampaign(item));
      return [listData, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListCampaignByWorkflowId() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getOneCampaign(id: number): Promise<[ICampaign | null, Error | null]> {
    try {
      const data = await CampaignModel.findOne({
        where: { id },
        include: [
          {
            model: ProfileGroupModel,
            as: "profileGroup",
            required: false,
            include: [{ model: ResourceGroupModel, required: false }],
          },
          {
            model: WorkflowModel,
            required: false,
          },
          { model: CampaignProfileModel, required: false },
        ],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }

      let campaign = formatCampaign(data);
      // enhance data
      const listCampaignId: number[] = [campaign?.id!];
      const [listCount] = await campaignProfileDB.countTotalCampaignProfile(
        listCampaignId,
        false,
      );

      const countItem = _.find(listCount, {
        campaignId: campaign?.id,
      });
      campaign = { ...campaign, totalProfile: countItem?.count || 0 };

      return [campaign, null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneCampaign() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createCampaign(
    data: ICampaign,
  ): Promise<[ICampaign | null, Error | null]> {
    try {
      const campaign = await CampaignModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          include: [
            { model: ProfileGroupModel, as: "profileGroup", required: false },
            { model: WorkflowModel, required: false },
          ],
          raw: false,
        },
      );

      // add to junction table
      if (data?.listWorkflowId) {
        // @ts-ignore
        await campaign.setWorkflows(data?.listWorkflowId);
      }

      if (data?.listCampaignProfileId) {
        // @ts-ignore
        await campaign.setCampaignProfiles(data?.listCampaignProfileId);
      }

      return [formatCampaign(campaign), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createCampaign() error: ${err?.message ?? err}`,
      });
      return [null, err];
    }
  }

  async updateCampaign(
    data: ICampaign,
  ): Promise<[ICampaign | null, Error | null]> {
    try {
      const updateData: any = {
        ...data,
        updateAt: new Date().getTime(),
      };

      await CampaignModel.update(_.omit(updateData, ["id"]), {
        where: { id: data?.id },
      });

      const campaignObject = await CampaignModel.findByPk(data?.id);

      if (campaignObject && data?.listWorkflowId) {
        // @ts-ignore
        await campaignObject.setWorkflows(data?.listWorkflowId);
      }

      if (campaignObject && data?.listCampaignProfileId) {
        // @ts-ignore
        await campaignObject.setCampaignProfiles(data?.listCampaignProfileId);
      }

      return this.getOneCampaign(data?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateCampaign() error: ${err?.message ?? err}`,
      });
      return [null, err];
    }
  }

  async deleteCampaign(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await CampaignModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteCampaign() error: ${err?.message ?? err}`,
      });
      return [null, err];
    }
  }

  getListCampaignByProfileGroupId = async (
    listProfileGroupId: number[],
  ): Promise<[ICampaign[], Error | null]> => {
    try {
      let listData: any = await CampaignModel.findAll({
        where: { profileGroupId: { [Op.in]: listProfileGroupId } },
        raw: false,
      });
      listData = listData?.map((item: Model<any, any>) => formatCampaign(item));

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListCampaignByProfileGroupId() error: ${err?.message}`,
      });
      return [[], err];
    }
  };
}

const campaignDB = new CampaignDB();
export { campaignDB };
