import _ from "lodash";
import { IAgentRegistry, IGetListResponse } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { formatAgentRegistry } from "@/electron/service/formatData";
import { encryptionService } from "@/electron/service/encrypt";
import { AgentRegistryModel, CampaignModel, JobModel } from "./index";

class AgentRegistryDB {
  async getListAgentRegistry(
    page: number,
    pageSize: number,
    searchText?: string,
  ): Promise<[IGetListResponse<IAgentRegistry> | null, Error | null]> {
    try {
      const { Op } = await import("sequelize");
      const condition = searchText
        ? { name: { [Op.like]: `%${searchText}%` } }
        : {};

      const totalDataAwait = AgentRegistryModel.count({ where: condition });
      const listDataAwait = AgentRegistryModel.findAll({
        order: [["createAt", "DESC"]],
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        include: [{ model: CampaignModel, as: "campaign", attributes: ["id", "name"] }],
      });

      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const totalPage = Math.ceil(totalData / Number(pageSize));

      return [
        {
          data: listData?.map((item: any) => formatAgentRegistry(item)) || [],
          totalData,
          page,
          pageSize,
          totalPage,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `getListAgentRegistry() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneAgentRegistry(
    id: number,
  ): Promise<[IAgentRegistry | null, Error | null]> {
    try {
      const data = await AgentRegistryModel.findOne({
        where: { id },
        include: [{ model: CampaignModel, as: "campaign", attributes: ["id", "name"] }],
      });

      if (!data) {
        return [null, null];
      }
      const formatted: any = formatAgentRegistry(data?.toJSON());

      return [formatted as IAgentRegistry, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneAgentRegistry() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createAgentRegistry(
    data: Partial<IAgentRegistry>,
  ): Promise<[IAgentRegistry | null, Error | null]> {
    try {
      const registry = await AgentRegistryModel.create(
        {
          ...data,
          allowedBaseTools: JSON.stringify(data?.allowedBaseTools || []),
          allowedMcpServerIds: JSON.stringify(data?.allowedMcpServerIds || []),
          allowedSkillIds: JSON.stringify(data?.allowedSkillIds || []),
          allowedSubAgentIds: JSON.stringify(data?.allowedSubAgentIds || []),
          profileIds: JSON.stringify(data?.profileIds || []),
          secretKey: data?.secretKey
            ? encryptionService.encryptData(data.secretKey)
            : "",
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        { raw: false },
      );

      return [formatAgentRegistry(registry?.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createAgentRegistry() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateAgentRegistry(
    data: IAgentRegistry,
  ): Promise<[IAgentRegistry | null, Error | null]> {
    try {
      await AgentRegistryModel.update(
        _.omit(
          {
            ...data,
            allowedBaseTools: JSON.stringify(data?.allowedBaseTools || []),
            allowedMcpServerIds: JSON.stringify(
              data?.allowedMcpServerIds || [],
            ),
            allowedSkillIds: JSON.stringify(data?.allowedSkillIds || []),
            allowedSubAgentIds: JSON.stringify(data?.allowedSubAgentIds || []),
            profileIds: JSON.stringify(data?.profileIds || []),
            secretKey: data?.secretKey
              ? encryptionService.encryptData(data.secretKey)
              : "",
            updateAt: new Date().getTime(),
          },
          ["id"],
        ),
        { where: { id: data?.id } },
      );

      return await this.getOneAgentRegistry(data?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateAgentRegistry() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteAgentRegistry(
    listId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      await JobModel.update(
        { agentRegistryId: null },
        { where: { agentRegistryId: listId } },
      );
      const count = await AgentRegistryModel.destroy({ where: { id: listId } });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteAgentRegistry() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

const agentRegistryDB = new AgentRegistryDB();
export { agentRegistryDB };
