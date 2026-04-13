import { IMcpToken, ISetting, SETTING_TYPE } from "@/electron/type";
import { settingDB } from "@/electron/database/setting";
import { logEveryWhere } from "@/electron/service/util";

class McpTokenService {
  private toMcpToken = (setting: ISetting): IMcpToken => ({
    id: setting.id,
    name: setting.name,
    tokenHash: setting.mcpTokenSetting?.tokenHash,
    permission: setting.mcpTokenSetting?.permission,
    createAt: setting.createAt,
    updateAt: setting.updateAt,
  });

  getListMcpToken = async (): Promise<[IMcpToken[] | null, Error | null]> => {
    try {
      const [response] = await settingDB.getListSetting(
        1,
        1000,
        undefined,
        undefined,
        SETTING_TYPE.MCP_TOKEN,
      );
      return [
        (response?.data || []).map((item) => this.toMcpToken(item)),
        null,
      ];
    } catch (err: any) {
      logEveryWhere({ message: `getListMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  };

  getOneMcpToken = async (
    id: number,
  ): Promise<[IMcpToken | null, Error | null]> => {
    try {
      const [setting] = await settingDB.getOneSetting(id);
      if (!setting) {
        return [null, null];
      }
      return [this.toMcpToken(setting), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  };

  getByTokenHash = async (
    tokenHash: string,
  ): Promise<[IMcpToken | null, Error | null]> => {
    try {
      const [response] = await settingDB.getListSetting(
        1,
        1000,
        undefined,
        undefined,
        SETTING_TYPE.MCP_TOKEN,
      );
      const setting = (response?.data || []).find(
        (item) => item.mcpTokenSetting?.tokenHash === tokenHash,
      );
      return [setting ? this.toMcpToken(setting) : null, null];
    } catch (err: any) {
      logEveryWhere({ message: `getByTokenHash() error: ${err?.message}` });
      return [null, err];
    }
  };

  createMcpToken = async (
    data: Partial<IMcpToken>,
  ): Promise<[IMcpToken | null, Error | null]> => {
    try {
      const [setting] = await settingDB.createSetting({
        name: data.name || "",
        type: SETTING_TYPE.MCP_TOKEN,
        data: JSON.stringify({
          tokenHash: data.tokenHash || "",
          permission: data.permission,
        }),
      });
      if (!setting) {
        return [null, null];
      }
      return [this.toMcpToken(setting), null];
    } catch (err: any) {
      logEveryWhere({ message: `createMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  };

  updateMcpToken = async (
    data: IMcpToken,
  ): Promise<[IMcpToken | null, Error | null]> => {
    try {
      const [current] = await settingDB.getOneSetting(data.id!);
      if (!current) {
        return [null, null];
      }
      const [setting] = await settingDB.updateSetting({
        ...current,
        name: data.name || current.name,
        data: JSON.stringify({
          tokenHash: data.tokenHash || current.mcpTokenSetting?.tokenHash || "",
          permission: data.permission || current.mcpTokenSetting?.permission,
        }),
      });
      if (!setting) {
        return [null, null];
      }
      return [this.toMcpToken(setting), null];
    } catch (err: any) {
      logEveryWhere({ message: `updateMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  };

  deleteMcpToken = async (
    listId: number[],
  ): Promise<[number | null, Error | null]> => {
    try {
      const [count] = await settingDB.deleteSetting(listId);
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteMcpToken() error: ${err?.message}` });
      return [null, err];
    }
  };
}

const mcpTokenService = new McpTokenService();
export { mcpTokenService };
