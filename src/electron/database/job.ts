import _ from "lodash";
import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  JobModel,
  ScheduleModel,
  WorkflowModel,
  CampaignModel,
  Schedule_Job,
} from "./index";
import { IJob } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { encryptionService } from "@/electron/service/encrypt";
import { formatDBResponse, formatJob } from "@/electron/service/formatData";
import { telegramBotService } from "@/electron/chatGateway/adapters/telegram";
import { preferenceDB } from "./preference";
import { campaignProfileDB } from "./campaignProfile";

class JobDB {
  getAllJob = async (
    listJob: IJob[],
  ): Promise<[IJob[] | null, Error | null]> => {
    try {
      if (listJob?.length === 0) {
        return [[], null];
      }
      let listData: any[] = await JobModel.findAll({
        where: {
          [Op.or]: listJob?.map((job) => {
            if (job?.campaignId && job?.workflowId) {
              return {
                campaignId: job?.campaignId,
                workflowId: job?.workflowId,
              };
            }

            return job;
          }),
        },
        include: [
          { model: ScheduleModel, required: false },
          { model: WorkflowModel, required: false, as: "workflow" },
          { model: CampaignModel, required: false, as: "campaign" },
        ],
        raw: false,
      });
      listData = listData?.map((data: any) => formatJob(data));
      return [listData || [], null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllJob() error: ${err?.message}` });
      return [null, err];
    }
  };

  async checkJobTimeout(job: IJob): Promise<boolean> {
    if (!job?.lastRunTime || !job?.timeout || !job.isRunning) {
      return false;
    }

    const currentTime = new Date();
    const lastRunTime = new Date(job?.lastRunTime!);
    const maxTime = dayjs(lastRunTime).add(job?.timeout, "minute");
    const isJobTimeout = dayjs(currentTime).isAfter(maxTime);
    if (!isJobTimeout) {
      return false;
    }

    // notify via telegram
    if (
      job?.schedule &&
      job?.schedule?.alertTelegram &&
      job?.campaignId !== undefined
    ) {
      const [preference] = await preferenceDB.getOnePreference();

      const [totalProfile, totalUnFinishedProfile] =
        await campaignProfileDB?.getCampaignProfileStatus(
          Number(job?.campaignId),
        );
      let message = "";
      message += `<i>Job timeout: ${job?.timeout} minutes</i>\n`;
      message += `<strong>Job starts at:</strong> ${dayjs(
        job?.lastRunTime,
      ).format("YYYY-MM-DD HH:mm")}\n`;
      message += `<strong>Current time:</strong> ${dayjs().format(
        "YYYY-MM-DD HH:mm",
      )}\n`;

      message += `<strong>Schedule name:</strong> ${
        job?.schedule?.name || "--"
      }\n`;
      message += `<strong>Campaign name:</strong> ${
        job?.campaign?.name || "--"
      }\n`;
      message += `<strong>Workflow name:</strong> ${
        job?.workflow?.name || "--"
      }\n`;
      message += `<strong>Total profile:</strong> ${totalProfile || 0}\n`;
      message += `<strong>Total unfinished profile:</strong> ${
        totalUnFinishedProfile || 0
      }\n`;
      await telegramBotService.sendMessage(
        preference?.botTokenTelegram || "",
        message,
        preference?.chatIdTelegram?.toString() || "",
      );
    }

    return true;
  }

  findOneJob = async (job: IJob): Promise<[IJob | null, Error | null]> => {
    try {
      const data = await JobModel.findOne({
        where: job,
        include: [
          { model: ScheduleModel, required: false },
          { model: WorkflowModel, required: false, as: "workflow" },
          { model: CampaignModel, required: false, as: "campaign" },
        ],
        raw: false,
      });
      if (!data) {
        return [null, null];
      }

      return [formatJob(data), null];
    } catch (err: any) {
      logEveryWhere({ message: `findOneJob() error: ${err?.message}` });
      return [null, err];
    }
  };

  async createJob(data: any): Promise<[any, Error | null]> {
    try {
      const createdJob: any = await JobModel.create(
        {
          ...data,
          isCompleted: false,
          secretKey: data?.secretKey
            ? encryptionService.encryptData(data?.secretKey)
            : "",
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        {
          raw: false,
        },
      );

      if (data?.scheduleId) {
        await createdJob?.setSchedules(data?.scheduleId);
      }

      return [createdJob, null];
    } catch (err: any) {
      logEveryWhere({ message: `createJob() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneJob(id: number): Promise<[IJob | null, Error | null]> {
    try {
      const data = await JobModel.findOne({
        where: { id },
        include: [{ model: ScheduleModel, required: false }],
        raw: false,
      });

      if (!data) {
        return [null, null];
      }
      return [formatJob(data), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneJob() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updateJob(data: IJob): Promise<[IJob | null, Error | null]> {
    try {
      const updateData: any = _.omit(
        {
          ...data,
          updateAt: new Date().getTime(),
        },
        ["id", "secretKey", "hasSecretKey"],
      );

      // Only update secretKey when explicitly provided
      if (data?.secretKey !== undefined) {
        updateData.secretKey = data.secretKey
          ? encryptionService.encryptData(data.secretKey)
          : "";
      }

      await JobModel.update(updateData, {
        where: { id: data?.id },
      });

      return await this.getOneJob(data?.id!);
    } catch (err: any) {
      logEveryWhere({ message: `updateJob() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getSecretKey(id: number): Promise<[string | null, Error | null]> {
    try {
      const data = await JobModel.findOne({
        where: { id },
        attributes: ["secretKey"],
        raw: false,
      });
      const formatedData = formatDBResponse(data as any);
      if (!formatedData?.secretKey) {
        return ["", null];
      }
      return [
        encryptionService.decryptData(formatedData.secretKey) || "",
        null,
      ];
    } catch (err: any) {
      return [null, err];
    }
  }

  async deleteJob(condition: any): Promise<Error | null> {
    try {
      const listJob: any[] = await JobModel.findAll({ where: condition });
      await JobModel.destroy({ where: condition });

      if (listJob) {
        await Schedule_Job.destroy({
          where: {
            jobId: { [Op.in]: listJob.map((job: IJob) => formatJob(job)?.id) },
          },
        });
      }
      return null;
    } catch (err: any) {
      logEveryWhere({ message: `deleteJob() error: ${err?.message}` });
      return err;
    }
  }
}

const jobDB = new JobDB();
export { jobDB };
