import _ from "lodash";
import { Op, literal } from "sequelize";
import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { formatAgentTask } from "@/electron/service/formatData";
import { AgentTaskModel, AgentProfileModel } from "./index";

const PRIORITY_ORDER = literal(
  `CASE priority WHEN 'URGENT' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END`,
);

class AgentTaskDB {
  async getListAgentTask(filter?: {
    taskIds?: number[];
    agentIds?: number[];
  }): Promise<[IAgentTask[] | null, Error | null]> {
    try {
      const where: any = {};
      if (filter?.taskIds?.length || filter?.agentIds?.length) {
        const conditions = [];
        if (filter.taskIds?.length) {
          conditions.push({ id: { [Op.in]: filter.taskIds } });
        }
        if (filter.agentIds?.length) {
          conditions.push({ assignedAgentId: { [Op.in]: filter.agentIds } });
        }
        where[Op.or] = conditions;
      }
      const list = await AgentTaskModel.findAll({
        where,
        order: [["createAt", "DESC"]],
        include: [
          {
            model: AgentProfileModel,
            as: "assignedAgent",
            required: false,
          },
          {
            model: AgentProfileModel,
            as: "creatorAgent",
            required: false,
          },
        ],
      });
      return [list.map((item: any) => formatAgentTask(item.toJSON())), null];
    } catch (err: any) {
      logEveryWhere({ message: `getListAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneAgentTask(
    id: number,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const data = await AgentTaskModel.findOne({
        where: { id },
        include: [
          {
            model: AgentProfileModel,
            as: "assignedAgent",
            required: false,
          },
          {
            model: AgentProfileModel,
            as: "creatorAgent",
            required: false,
          },
        ],
      });
      if (!data) {
        return [null, null];
      }
      return [formatAgentTask(data.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getTasksByStatus(
    status: AgentTaskStatus,
  ): Promise<[IAgentTask[] | null, Error | null]> {
    try {
      const list = await AgentTaskModel.findAll({
        where: { status },
        order: [
          [PRIORITY_ORDER, "DESC"],
          [literal("CASE WHEN dueAt IS NULL THEN 1 ELSE 0 END"), "ASC"],
          ["dueAt", "ASC"],
          ["createAt", "ASC"],
        ],
      });
      return [list.map((item: any) => formatAgentTask(item.toJSON())), null];
    } catch (err: any) {
      logEveryWhere({ message: `getTasksByStatus() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createAgentTask(
    data: Partial<IAgentTask>,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const task = await AgentTaskModel.create(
        {
          ...data,
          metadata: JSON.stringify(data.metadata || {}),
          result: data.result ? JSON.stringify(data.result) : null,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        { raw: false },
      );
      return await this.getOneAgentTask((task as any).id);
    } catch (err: any) {
      logEveryWhere({ message: `createAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async expireOverdueTasks(now: number): Promise<[number, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        { status: AgentTaskStatus.EXPIRED, updateAt: now } as any,
        {
          where: {
            status: [AgentTaskStatus.INIT, AgentTaskStatus.IN_PROGRESS],
            [Op.or]: [
              { dueAt: { [Op.lt]: now } },
              literal(
                `(ttlSeconds IS NOT NULL AND createAt + ttlSeconds * 1000 < ${now})`,
              ),
            ],
          },
        },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `expireOverdueTasks() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async requeueAllInProgressTasks(): Promise<[number, Error | null]> {
    try {
      const now = Date.now();
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.INIT,
          assignedAgentId: null,
          claimedAt: null,
          startedAt: null,
          retryCount: literal("retryCount + 1"),
          updateAt: now,
        } as any,
        { where: { status: AgentTaskStatus.IN_PROGRESS } },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `requeueAllInProgressTasks() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async requeueStaleTasks(now: number): Promise<[number, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.INIT,
          assignedAgentId: null,
          claimedAt: null,
          startedAt: null,
          retryCount: literal("retryCount + 1"),
          updateAt: now,
        } as any,
        {
          where: {
            status: AgentTaskStatus.IN_PROGRESS,
            [Op.and]: [
              literal("timeout IS NOT NULL"),
              literal(`updateAt < (${now} - timeout * 60000)`),
            ],
          },
        },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `requeueStaleTasks() error: ${err?.message}` });
      return [0, err];
    }
  }

  async countInProgressByAgent(
    agentId: number,
  ): Promise<[number, Error | null]> {
    try {
      const count = await AgentTaskModel.count({
        where: {
          assignedAgentId: agentId,
          status: AgentTaskStatus.IN_PROGRESS,
        },
      });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `countInProgressByAgent() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async expireAgentTask(id: number): Promise<[boolean, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.EXPIRED,
          updateAt: new Date().getTime(),
        } as any,
        {
          where: {
            id,
            status: [AgentTaskStatus.INIT, AgentTaskStatus.IN_PROGRESS],
          },
        },
      );
      return [count > 0, null];
    } catch (err: any) {
      logEveryWhere({ message: `expireAgentTask() error: ${err?.message}` });
      return [false, err];
    }
  }

  async updateAgentTask(
    id: number,
    data: Partial<IAgentTask>,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const where: any = { id };
      if (data.status !== undefined) {
        where.status = {
          [Op.notIn]: [
            AgentTaskStatus.DONE,
            AgentTaskStatus.FAILED,
            AgentTaskStatus.EXPIRED,
          ],
        };
      }
      const resetFields =
        data.status === AgentTaskStatus.INIT
          ? { assignedAgentId: null, claimedAt: null, startedAt: null }
          : {};
      await AgentTaskModel.update(
        _.omit(
          {
            ...data,
            ...resetFields,
            metadata:
              data.metadata !== undefined
                ? JSON.stringify(data.metadata)
                : undefined,
            result:
              data.result !== undefined
                ? JSON.stringify(data.result)
                : undefined,
            updateAt: new Date().getTime(),
          },
          ["id"],
        ) as any,
        { where },
      );
      return await this.getOneAgentTask(id);
    } catch (err: any) {
      logEveryWhere({ message: `updateAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async claimAgentTask(
    taskId: number,
    agentId: number,
    maxConcurrent: number,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const [runningCount] = await this.countInProgressByAgent(agentId);
      if (runningCount >= maxConcurrent) {
        return [null, new Error("capacity_exceeded")];
      }

      const now = new Date().getTime();
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.IN_PROGRESS,
          assignedAgentId: agentId,
          claimedAt: now,
          startedAt: now,
          updateAt: now,
        } as any,
        { where: { id: taskId, status: AgentTaskStatus.INIT } },
      );

      if (count === 0) {
        return [null, new Error("already_claimed")];
      }

      return await this.getOneAgentTask(taskId);
    } catch (err: any) {
      logEveryWhere({ message: `claimAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async unassignTasksByAgentIds(
    agentIds: number[],
  ): Promise<[number, Error | null]> {
    try {
      const now = Date.now();
      const [count] = await AgentTaskModel.update(
        {
          assignedAgentId: null,
          status: AgentTaskStatus.INIT,
          claimedAt: null,
          startedAt: null,
          updateAt: now,
        } as any,
        {
          where: {
            assignedAgentId: { [Op.in]: agentIds },
            status: [AgentTaskStatus.INIT, AgentTaskStatus.IN_PROGRESS],
          },
        },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `unassignTasksByAgentIds() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async getAgentAnalytics(fromTimestamp: number): Promise<[any, Error | null]> {
    try {
      const now = Date.now();

      // tasks completed/failed/cancelled/expired within period
      const periodTasks = await AgentTaskModel.findAll({
        where: { createAt: { [Op.gte]: fromTimestamp } },
        include: [
          {
            model: AgentProfileModel,
            as: "assignedAgent",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        raw: false,
      });

      const doneTasks = periodTasks.filter(
        (task: any) => task.status === AgentTaskStatus.DONE,
      );
      const failedTasks = periodTasks.filter(
        (task: any) => task.status === AgentTaskStatus.FAILED,
      );

      const totalDone = doneTasks.length;
      const totalFailed = failedTasks.length;

      // Avg duration: completedAt - startedAt for DONE tasks
      const durationsMs = doneTasks
        .filter((task: any) => task.completedAt && task.startedAt)
        .map((task: any) => task.completedAt - task.startedAt);
      const avgDurationMs =
        durationsMs.length > 0
          ? Math.round(
              durationsMs.reduce(
                (sum: number, value: number) => sum + value,
                0,
              ) / durationsMs.length,
            )
          : 0;

      // Avg wait time: startedAt - createAt for tasks that were started in period
      const waitTimesMs = periodTasks
        .filter((task: any) => task.startedAt && task.createAt)
        .map((task: any) => task.startedAt - task.createAt);
      const avgWaitTimeMs =
        waitTimesMs.length > 0
          ? Math.round(
              waitTimesMs.reduce(
                (sum: number, value: number) => sum + value,
                0,
              ) / waitTimesMs.length,
            )
          : 0;

      // Live counts (ignore period)
      const pendingNow = await AgentTaskModel.count({
        where: { status: AgentTaskStatus.INIT },
      });
      const inProgressNow = await AgentTaskModel.count({
        where: { status: AgentTaskStatus.IN_PROGRESS },
      });

      // Daily activity: bucket tasks by day
      const dayBuckets: Record<string, { done: number; failed: number }> = {};
      const msPerDay = 86400000;
      const startOfDay = new Date(fromTimestamp);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayTimestamp = startOfDay.getTime();
      const totalDays = Math.max(
        1,
        Math.ceil((now - startOfDayTimestamp) / msPerDay),
      );

      for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const date = new Date(startOfDayTimestamp + dayIndex * msPerDay);
        const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
        dayBuckets[dateKey] = { done: 0, failed: 0 };
      }

      for (const task of periodTasks as any[]) {
        const taskDate = new Date(task.createAt);
        const dateKey = `${taskDate.getMonth() + 1}/${taskDate.getDate()}`;
        if (!dayBuckets[dateKey]) {
          continue;
        }

        if (task.status === AgentTaskStatus.DONE) {
          dayBuckets[dateKey].done += 1;
        } else if (task.status === AgentTaskStatus.FAILED) {
          dayBuckets[dateKey].failed += 1;
        }
      }
      const dailyActivity = Object.entries(dayBuckets).map(
        ([date, counts]) => ({ date, ...counts }),
      );

      // Hourly activity heatmap: [hour(0-23), weekday(Mon=0..Sun=6), count]
      const hourlyMap: Record<string, number> = {};
      for (let weekday = 0; weekday < 7; weekday++) {
        for (let hour = 0; hour < 24; hour++) {
          hourlyMap[`${weekday}-${hour}`] = 0;
        }
      }
      for (const task of periodTasks as any[]) {
        const taskDate = new Date(task.createAt);
        const hour = taskDate.getHours();
        const weekday = (taskDate.getDay() + 6) % 7; // Sun=0 -> Mon=0
        const key = `${weekday}-${hour}`;
        if (hourlyMap[key] !== undefined) {
          hourlyMap[key] += 1;
        }
      }
      const hourlyActivity: number[][] = [];
      for (let weekday = 0; weekday < 7; weekday++) {
        for (let hour = 0; hour < 24; hour++) {
          hourlyActivity.push([hour, weekday, hourlyMap[`${weekday}-${hour}`]]);
        }
      }

      // Per-agent stats
      const agentMap: Record<
        number,
        {
          agentId: number;
          name: string;
          done: number;
          failed: number;
          durationsMs: number[];
        }
      > = {};
      for (const task of periodTasks as any[]) {
        const agentId = task.assignedAgentId;
        if (!agentId) {
          continue;
        }

        if (!agentMap[agentId]) {
          agentMap[agentId] = {
            agentId,
            name: task.assignedAgent?.name || `Agent #${agentId}`,
            done: 0,
            failed: 0,
            durationsMs: [],
          };
        }

        if (task.status === AgentTaskStatus.DONE) {
          agentMap[agentId].done += 1;
          if (task.completedAt && task.startedAt) {
            agentMap[agentId].durationsMs.push(
              task.completedAt - task.startedAt,
            );
          }
        } else if (task.status === AgentTaskStatus.FAILED) {
          agentMap[agentId].failed += 1;
        }
      }

      const perAgentStats = Object.values(agentMap).map((agentEntry) => ({
        agentId: agentEntry.agentId,
        name: agentEntry.name,
        done: agentEntry.done,
        failed: agentEntry.failed,
        avgDurationMs:
          agentEntry.durationsMs.length > 0
            ? Math.round(
                agentEntry.durationsMs.reduce((sum, value) => sum + value, 0) /
                  agentEntry.durationsMs.length,
              )
            : 0,
      }));

      return [
        {
          totalDone,
          totalFailed,
          avgDurationMs,
          avgWaitTimeMs,
          pendingNow,
          inProgressNow,
          dailyActivity,
          hourlyActivity,
          perAgentStats,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({ message: `getAgentAnalytics() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deleteAgentTask(
    listId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const count = await AgentTaskModel.destroy({ where: { id: listId } });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const agentTaskDB = new AgentTaskDB();
export { agentTaskDB };
