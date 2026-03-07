import { Op, Model } from "sequelize";
import _ from "lodash";
import { IWorkflow, IGetListResponse, ISorter } from "@/electron/type";
import { WorkflowModel } from "./index";
import { formatWorkflow } from "@/electron/service/formatData";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class WorkflowDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await WorkflowModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListWorkflow(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IWorkflow> | null, Error | null]> {
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
      const totalDataAwait = WorkflowModel.count({ where: condition });
      const listDataAwait = WorkflowModel.findAll({
        order: [
          sortField?.field === "color" ? ["color", sortOrder] : [],
          sortField?.field === "name" ? ["name", sortOrder] : [],
          sortField?.field === "updateAt" ? ["updateAt", sortOrder] : [],
          sortField?.field === "createAt" ? ["createAt", sortOrder] : [],
        ].filter((pair: string[]) => pair?.length > 0) as any,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        raw: false,
      });

      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);
      const totalPage = Math.ceil(totalData / Number(pageSize));
      listData = listData?.map((item: Model<any, any>) => formatWorkflow(item));

      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListWorkflow() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getListWorkflowById(
    listID: number[],
  ): Promise<[IWorkflow[], Error | null]> {
    try {
      let listData: any = await WorkflowModel.findAll({
        where: { id: { [Op.in]: listID } },
        raw: false,
      });
      listData = listData?.map((item: Model<any, any>) => formatWorkflow(item));

      return [listData, null];
    } catch (err: any) {
      logEveryWhere({ message: `getListWorkflowById() error: ${err?.message}` });
      return [[], err];
    }
  }

  async getOneWorkflow(id: number): Promise<[IWorkflow | null, Error | null]> {
    try {
      const data = await WorkflowModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [formatWorkflow(data), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneWorkflow() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createWorkflow(
    data: IWorkflow,
  ): Promise<[IWorkflow | null, Error | null]> {
    try {
      const workflow = await WorkflowModel.create(
        {
          ...data,
          listVariable: JSON.stringify(data?.listVariable || []),
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );

      return [formatWorkflow(workflow), null];
    } catch (err: any) {
      logEveryWhere({ message: `createWorkflow() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createBulkWorkflow(listWorkflow: IWorkflow[]): Promise<Error | null> {
    try {
      await WorkflowModel.bulkCreate(
        listWorkflow?.map((workflow: IWorkflow) => ({
          ...workflow,
          listVariable: JSON.stringify(workflow?.listVariable || []),
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        })),
        { ignoreDuplicates: true },
      );

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `createBulkWorkflow() error: ${err?.message}` });
      return err;
    }
  }

  async updateWorkflow(
    workflow: IWorkflow,
  ): Promise<[IWorkflow | null, Error | null]> {
    try {
      await WorkflowModel.update(
        _.omit(
          {
            ...workflow,
            listVariable: JSON.stringify(workflow?.listVariable || []),
            updateAt: new Date().getTime(),
          },
          ["id"],
        ),
        {
          where: { id: workflow?.id },
        },
      );

      return this.getOneWorkflow(workflow?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateWorkflow() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteWorkflow(listID: number[]): Promise<[number | null, Error | null]> {
    try {
      const data = await WorkflowModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteWorkflow() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const workflowDB = new WorkflowDB();
export { workflowDB };
