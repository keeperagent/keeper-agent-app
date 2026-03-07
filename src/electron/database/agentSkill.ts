import { Op } from "sequelize";
import _ from "lodash";
import { IAgentSkill, IGetListResponse, ISorter } from "@/electron/type";
import { AgentSkillModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class AgentSkillDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await AgentSkillModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListAgentSkill(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IAgentSkill> | null, Error | null]> {
    try {
      const condition = {
        [Op.and]: [
          searchText
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${searchText}%` } },
                  { description: { [Op.like]: `%${searchText}%` } },
                ],
              }
            : {},
        ],
      };
      const sortOrder = sortField?.order === SORT_ORDER.DESC ? "DESC" : "ASC";
      const orderPairs = [
        sortField?.field === "name" ? ["name", sortOrder] : [],
        sortField?.field === "description" ? ["description", sortOrder] : [],
        sortField?.field === "isEnabled" ? ["isEnabled", sortOrder] : [],
        sortField?.field === "createAt" ? ["createAt", sortOrder] : [],
        sortField?.field === "updateAt" ? ["updateAt", sortOrder] : [],
      ].filter((pair: string[]) => pair.length > 0) as [string, string][];
      const order =
        orderPairs.length > 0
          ? orderPairs
          : ([["createAt", "DESC"]] as [string, string][]);

      const totalDataAwait = AgentSkillModel.count({
        where: !searchText ? condition : {},
      });
      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = AgentSkillModel.findAll({
        order,
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        raw: true,
      });

      const [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const totalPage = Math.ceil(totalData / Number(pageSize));

      return [
        {
          data: listData,
          totalData,
          page,
          pageSize,
          totalPage,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({ message: `getListAgentSkill() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getEnabledAgentSkills(): Promise<[IAgentSkill[] | null, Error | null]> {
    try {
      const listData: any[] = await AgentSkillModel.findAll({
        where: { isEnabled: true },
        raw: true,
      });
      return [listData, null];
    } catch (err: any) {
      logEveryWhere({ message: `getEnabledAgentSkills() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneAgentSkill(
    id: number,
  ): Promise<[IAgentSkill | null, Error | null]> {
    try {
      const data = await AgentSkillModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneAgentSkill() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createAgentSkill(
    data: Partial<IAgentSkill>,
  ): Promise<[IAgentSkill | null, Error | null]> {
    try {
      const agentSkill = await AgentSkillModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        {
          raw: false,
        },
      );

      return [agentSkill?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createAgentSkill() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateAgentSkill(
    data: IAgentSkill,
  ): Promise<[IAgentSkill | null, Error | null]> {
    try {
      await AgentSkillModel.update(
        _.omit({ ...data, updateAt: new Date().getTime() }, ["id"]) as any,
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneAgentSkill(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateAgentSkill() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteAgentSkill(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await AgentSkillModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteAgentSkill() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const agentSkillDB = new AgentSkillDB();
export { agentSkillDB };
