import { Op } from "sequelize";
import _ from "lodash";
import { workflowDB } from "./workflow";
import { WorkflowGroupModel } from "./index";
import { IWorkflowGroup, IGetListResponse, ISorter } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { SORT_ORDER } from "@/electron/constant";

class WorkflowGroupDB {
  async totalData(): Promise<[number | null, Error | null]> {
    try {
      return [await WorkflowGroupModel.count(), null];
    } catch (err: any) {
      return [null, err];
    }
  }

  async getListWorkflowGroup(
    page: number,
    pageSize: number,
    searchText?: string,
    sortField?: ISorter,
  ): Promise<[IGetListResponse<IWorkflowGroup> | null, Error | null]> {
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
      const totalDataAwait = WorkflowGroupModel.count({ where: condition });
      const listDataAwait = WorkflowGroupModel.findAll({
        order: [
          sortField?.field === "name" ? ["name", sortOrder] : [],
          sortField?.field === "updateAt" ? ["updateAt", sortOrder] : [],
          sortField?.field === "createAt" ? ["createAt", sortOrder] : [],
        ].filter((pair: string[]) => pair?.length > 0) as any[],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: condition,
        raw: true,
      });

      // run in parallel
      let [totalData, listData]: any = await Promise.all([
        totalDataAwait,
        listDataAwait,
      ]);

      const listGroupId: number[] =
        listData?.map((group: IWorkflowGroup) => group?.id) || [];
      const [listCount] = await workflowDB.countTotalWorkflow(listGroupId);
      listData = listData?.map((data: any) => {
        const countItem = _.find(listCount, {
          groupId: data?.id,
        });
        return { ...data, totalWorkflow: countItem?.count || 0 };
      });

      const totalPage = Math.ceil(totalData / Number(pageSize));
      return [{ data: listData, totalData, page, pageSize, totalPage }, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getListWorkflowGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getOneWorkflowGroup(
    id: number,
  ): Promise<[IWorkflowGroup | null, Error | null]> {
    try {
      const data = await WorkflowGroupModel.findOne({
        where: { id },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOneWorkflowGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createWorkflowGroup(
    group: IWorkflowGroup,
  ): Promise<[IWorkflowGroup | null, Error | null]> {
    try {
      const data = await WorkflowGroupModel.create(
        {
          ...group,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `createWorkflowGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateWorkflowGroup(
    group: IWorkflowGroup,
  ): Promise<[IWorkflowGroup | null, Error | null]> {
    try {
      await WorkflowGroupModel.update(
        _.omit({ ...group, updateAt: new Date().getTime() }, ["id"]),
        {
          where: { id: group?.id },
        },
      );

      return this.getOneWorkflowGroup(group?.id!);
    } catch (err: any) {
      logEveryWhere({
        message: `updateWorkflowGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async deleteWorkflowGroup(
    listGroupId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      await workflowDB.unassignWorkflowGroup(listGroupId);
      const data = await WorkflowGroupModel.destroy({
        where: { id: listGroupId },
      });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `deleteWorkflowGroup() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

const workflowGroupDB = new WorkflowGroupDB();
export { workflowGroupDB };
