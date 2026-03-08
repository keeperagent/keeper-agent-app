import { Op } from "sequelize";
import _ from "lodash";
import { IMcpServer, IGetListResponse, ISorter } from "@/electron/type";
import { McpServerModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";
import { formatMcpServer } from "@/electron/service/formatData";
import { SORT_ORDER } from "@/electron/constant";

class McpServerDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await McpServerModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListMcpServer(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IMcpServer> | null, Error | null]> {
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
      ].filter((pair: string[]) => pair.length > 0);
      const order: any =
        orderPairs.length > 0 ? orderPairs : [["createAt", "DESC"]];

      const totalDataAwait = McpServerModel.count({
        where: !searchText ? condition : {},
      });

      // When searchText is set, omit limit/offset so LIKE search works. See: https://github.com/sequelize/sequelize/issues/12971
      const listDataAwait = McpServerModel.findAll({
        order,
        ...(searchText
          ? {}
          : { limit: pageSize, offset: (page - 1) * pageSize }),
        where: condition,
        raw: true,
      });

      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      const totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((item: any) => formatMcpServer(item));

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
      logEveryWhere({ message: `getListMcpServer() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneMcpServer(
    id: number,
  ): Promise<[IMcpServer | null, Error | null]> {
    try {
      const data = await McpServerModel.findOne({
        where: { id },
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [formatMcpServer(data?.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneMcpServer() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createMcpServer(
    data: Partial<IMcpServer>,
  ): Promise<[IMcpServer | null, Error | null]> {
    try {
      const mcpServer = await McpServerModel.create(
        {
          ...data,
          disabledTools: JSON.stringify(data?.disabledTools || []),
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        {
          raw: false,
        },
      );

      return [formatMcpServer(mcpServer?.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({ message: `createMcpServer() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateMcpServer(
    data: IMcpServer,
  ): Promise<[IMcpServer | null, Error | null]> {
    try {
      await McpServerModel.update(
        _.omit(
          {
            ...data,
            disabledTools: JSON.stringify(data?.disabledTools || []),
            updateAt: new Date().getTime(),
          },
          ["id"],
        ) as any,
        {
          where: { id: data?.id },
        },
      );

      return await this.getOneMcpServer(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateMcpServer() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteMcpServer(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await McpServerModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteMcpServer() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const mcpServerDB = new McpServerDB();
export { mcpServerDB };
