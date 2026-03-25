import _ from "lodash";
import { IMcpToken } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { McpTokenModel } from "./index";

class McpTokenDB {
  async getListMcpToken(): Promise<[IMcpToken[] | null, Error | null]> {
    try {
      const list = await McpTokenModel.findAll({
        order: [["createAt", "DESC"]],
        raw: true,
      });
      return [list as unknown as IMcpToken[], null];
    } catch (err: any) {
      logEveryWhere({ message: `getListMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneMcpToken(id: number): Promise<[IMcpToken | null, Error | null]> {
    try {
      const data = await McpTokenModel.findOne({ where: { id }, raw: true });
      if (!data) {
        return [null, null];
      }
      return [data as unknown as IMcpToken, null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getByTokenHash(
    tokenHash: string,
  ): Promise<[IMcpToken | null, Error | null]> {
    try {
      const data = await McpTokenModel.findOne({
        where: { tokenHash },
        raw: true,
      });
      if (!data) {
        return [null, null];
      }
      return [data as unknown as IMcpToken, null];
    } catch (err: any) {
      logEveryWhere({ message: `getByTokenHash() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createMcpToken(
    data: Partial<IMcpToken>,
  ): Promise<[IMcpToken | null, Error | null]> {
    try {
      const token = await McpTokenModel.create(
        {
          ...data,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        { raw: false },
      );
      return [token?.toJSON() as IMcpToken, null];
    } catch (err: any) {
      logEveryWhere({ message: `createMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateMcpToken(
    data: IMcpToken,
  ): Promise<[IMcpToken | null, Error | null]> {
    try {
      await McpTokenModel.update(
        _.omit(
          {
            ...data,
            updateAt: new Date().getTime(),
          },
          ["id"],
        ) as any,
        { where: { id: data?.id } },
      );
      return await this.getOneMcpToken(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteMcpToken(
    listId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const count = await McpTokenModel.destroy({ where: { id: listId } });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const mcpTokenDB = new McpTokenDB();
export { mcpTokenDB };
