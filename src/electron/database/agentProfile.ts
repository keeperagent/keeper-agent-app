import _ from "lodash";
import { IAgentProfile, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import {
  formatDBResponse,
  formatAgentProfile,
} from "@/electron/service/formatData";
import { encryptionService } from "@/electron/service/encrypt";
import { AgentProfileModel, CampaignModel, JobModel } from "./index";

class AgentProfileDB {
  private _mainAgentReadyPromise: Promise<void> | null = null;

  async getListAgentProfile(
    page: number,
    pageSize: number,
    searchText?: string,
  ): Promise<[IGetListResponse<IAgentProfile> | null, Error | null]> {
    try {
      const { Op } = await import("sequelize");
      const condition = searchText
        ? { name: { [Op.like]: `%${searchText}%` } }
        : {};

      const totalDataAwait = AgentProfileModel.count({ where: condition });
      const listDataAwait = AgentProfileModel.findAll({
        order: [
          ["isMainAgent", "DESC"],
          ["createAt", "DESC"],
        ],
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        include: [
          { model: CampaignModel, as: "campaign", attributes: ["id", "name"] },
        ],
      });

      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const totalPage = Math.ceil(totalData / Number(pageSize));

      return [
        {
          data: listData?.map((item: any) => formatAgentProfile(item)) || [],
          totalData,
          page,
          pageSize,
          totalPage,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `getListAgentProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneAgentProfile(
    id: number,
  ): Promise<[IAgentProfile | null, Error | null]> {
    try {
      const data = await AgentProfileModel.findOne({
        where: { id },
        include: [
          { model: CampaignModel, as: "campaign", attributes: ["id", "name"] },
        ],
      });

      if (!data) {
        return [null, null];
      }
      const formatted: any = formatAgentProfile(data?.toJSON());

      return [formatted as IAgentProfile, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneAgentProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createAgentProfile(
    data: Partial<IAgentProfile>,
  ): Promise<[IAgentProfile | null, Error | null]> {
    try {
      const row = await AgentProfileModel.create(
        {
          ...data,
          isMainAgent: Boolean(data?.isMainAgent),
          allowedBaseTools: JSON.stringify(data?.allowedBaseTools || []),
          allowedMcpServerIds: JSON.stringify(data?.allowedMcpServerIds || []),
          allowedSkillIds: JSON.stringify(data?.allowedSkillIds || []),
          allowedSubAgentIds: JSON.stringify(data?.allowedSubAgentIds || []),
          profileIds: JSON.stringify(data?.profileIds || []),
          encryptKey: data?.encryptKey
            ? encryptionService.encryptData(data.encryptKey)
            : "",
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        { raw: false },
      );

      return [formatAgentProfile(row?.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createAgentProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateAgentProfile(
    data: IAgentProfile,
  ): Promise<[IAgentProfile | null, Error | null]> {
    try {
      const updateData: any = _.omit(
        {
          ...data,
          allowedBaseTools: JSON.stringify(data?.allowedBaseTools || []),
          allowedMcpServerIds: JSON.stringify(data?.allowedMcpServerIds || []),
          allowedSkillIds: JSON.stringify(data?.allowedSkillIds || []),
          allowedSubAgentIds: JSON.stringify(data?.allowedSubAgentIds || []),
          profileIds: JSON.stringify(data?.profileIds || []),
          updateAt: new Date().getTime(),
        },
        ["id", "encryptKey", "hasEncryptKey"],
      );

      if (data?.encryptKey !== undefined) {
        updateData.encryptKey = data.encryptKey
          ? encryptionService.encryptData(data.encryptKey)
          : "";
      }

      await AgentProfileModel.update(updateData, {
        where: { id: data?.id },
      });

      return await this.getOneAgentProfile(data?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateAgentProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getActiveAgentProfiles(): Promise<[IAgentProfile[], Error | null]> {
    try {
      const list = await AgentProfileModel.findAll({
        where: { isActive: true },
      });
      return [list.map((item: any) => formatAgentProfile(item.toJSON())), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getActiveAgentProfiles() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getEncryptKey(id: number): Promise<[string | null, Error | null]> {
    try {
      const data = await AgentProfileModel.findOne({
        where: { id },
        attributes: ["encryptKey"],
        raw: false,
      });
      const formatedData = formatDBResponse(data as any);
      if (!formatedData?.encryptKey) {
        return ["", null];
      }
      return [
        encryptionService.decryptData(formatedData.encryptKey) || "",
        null,
      ];
    } catch (err: any) {
      return [null, err];
    }
  }

  async deleteAgentProfile(
    listId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      await JobModel.update(
        { agentProfileId: null },
        { where: { agentProfileId: listId } },
      );
      const count = await AgentProfileModel.destroy({
        where: { id: listId, isMainAgent: false },
      });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteAgentProfile() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getMainAgentProfile(): Promise<IAgentProfile | null> {
    try {
      const data = await AgentProfileModel.findOne({
        where: { isMainAgent: true },
      });
      if (!data) {
        return null;
      }
      return formatAgentProfile(data.toJSON());
    } catch (err: any) {
      logEveryWhere({
        message: `getMainAgentProfile() error: ${err?.message}`,
      });
      return null;
    }
  }

  initMainAgent(): Promise<void> {
    if (!this._mainAgentReadyPromise) {
      this._mainAgentReadyPromise = (async () => {
        try {
          const existing = await AgentProfileModel.findOne({
            where: { isMainAgent: true },
          });
          if (existing) {
            return;
          }
          await this.createAgentProfile({
            name: "Main Agent",
            description: "The built-in main agent",
            isMainAgent: true,
            isActive: true,
          });
        } catch (err: any) {
          logEveryWhere({ message: `initMainAgent() error: ${err?.message}` });
        }
      })();
    }
    return this._mainAgentReadyPromise;
  }
}

const agentProfileDB = new AgentProfileDB();
export { agentProfileDB };
