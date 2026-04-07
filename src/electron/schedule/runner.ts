import _ from "lodash";
import { IJob, ISchedule, AppLogType } from "@/electron/type";
import { workflowManager } from "@/electron/simulator/workflow";
import { jobDB } from "@/electron/database/job";
import { sleep } from "@/electron/service/util";
import { appLogDB } from "@/electron/database/appLog";
import { SCHEDULE_LOG_ACTION } from "@/electron/constant";
import { CampaignProfileModel } from "@/electron/database";
import { logEveryWhere } from "@/electron/service/util";
import { scheduleDB } from "@/electron/database/schedule";

class ScheduleRunner {
  private schedule: ISchedule;

  constructor(schedule: ISchedule) {
    this.schedule = schedule;
  }

  run = async (shouldResetRound: boolean) => {
    let { listJob = [] } = this.schedule;
    listJob = _.orderBy(listJob, ["order"], ["asc"]);
    for (const job of listJob) {
      if (job?.isCompleted) {
        continue;
      }
      await this.runJob(job, shouldResetRound);
    }
    await scheduleDB.updateSchedule({
      id: this.schedule?.id!,
      isCompleted: true,
      lastEndTime: new Date().getTime(),
      isRunning: false,
    });
  };

  markJobCompleted = async (job: IJob) => {
    if (!job?.workflowId || !job?.campaignId) {
      return;
    }

    const workflow = await workflowManager.getWorkflow(
      job?.workflowId,
      job?.campaignId,
      this.schedule?.id!,
    );
    workflow.monitor.stopAllThread();

    await jobDB.updateJob({
      isCompleted: true,
      isRunning: false,
      id: job?.id!,
    });
  };

  private runJob = async (job: IJob, shouldResetRound: boolean) => {
    if (!job?.workflowId || !job?.campaignId) {
      return;
    }

    let isJobTimeout = await jobDB.checkJobTimeout(job);
    if (isJobTimeout) {
      logEveryWhere({
        workflowId: job?.workflowId || undefined,
        campaignId: job?.campaignId || undefined,
        campaignName: job?.campaign?.name,
        workflowName: job?.workflow?.name,
        message: `job timeout, schedule: ${this.schedule?.name} - jobId: ${job?.id} - campaign: ${job?.campaign?.name} - workflow: ${job?.workflow?.name}`,
      });
      await appLogDB.createAppLog({
        logType: AppLogType.SCHEDULE,
        campaignId: job?.campaignId || undefined,
        workflowId: job?.workflowId || undefined,
        scheduleId: this.schedule?.id!,
        action: SCHEDULE_LOG_ACTION.JOB_TIMEOUT,
      });
      return;
    }

    let shouldWait = await workflowManager.shouldWaitBeforeRun(
      job?.campaignId!,
    );
    while (shouldWait) {
      // wait until not workflow is running with browser
      await sleep(30000);
      shouldWait = await workflowManager.shouldWaitBeforeRun(job?.campaignId!);
    }

    const workflow = await workflowManager.getWorkflow(
      job?.workflowId,
      job?.campaignId,
      this.schedule?.id!,
    );

    await appLogDB.createAppLog({
      logType: AppLogType.SCHEDULE,
      campaignId: job?.campaignId || undefined,
      workflowId: job?.workflowId || undefined,
      scheduleId: this.schedule?.id!,
      action: SCHEDULE_LOG_ACTION.JOB_START,
    });
    if (shouldResetRound) {
      await CampaignProfileModel.update(
        {
          round: 0,
        },
        { where: { campaignId: job?.campaignId } },
      );
    }

    logEveryWhere({
      workflowId: job?.workflowId || undefined,
      campaignId: job?.campaignId || undefined,
      campaignName: job?.campaign?.name,
      workflowName: job?.workflow?.name,
      message: `job trigger, schedule: ${this.schedule?.name} - jobId: ${job?.id} - campaign: ${job?.campaign?.name} - workflow: ${job?.workflow?.name}`,
    });
    const [jobEncryptKey, encryptKeyErr] = await jobDB.getEncryptKey(job.id!);
    if (encryptKeyErr) {
      logEveryWhere({
        message: `ScheduleRunner failed to get encrypt key for job ${job.id}: ${encryptKeyErr?.message}`,
      });
      return;
    }
    workflow.runWorkflow(jobEncryptKey || "");

    const checkTimeoutInterval = setInterval(async () => {
      isJobTimeout = await jobDB.checkJobTimeout(job);
      if (isJobTimeout) {
        await workflow.stopWorkflow();
        workflowManager.clearWorkflow(
          job?.workflowId!,
          job?.campaignId!,
          this.schedule?.id!,
        );
        logEveryWhere({
          workflowId: job?.workflowId || undefined,
          campaignId: job?.campaignId || undefined,
          campaignName: job?.campaign?.name,
          workflowName: job?.workflow?.name,
          message: `job timeout, schedule: ${this.schedule?.name} - jobId: ${job?.id} - campaign: ${job?.campaign?.name} - workflow: ${job?.workflow?.name}`,
        });
        await appLogDB.createAppLog({
          logType: AppLogType.SCHEDULE,
          campaignId: job?.campaignId || undefined,
          workflowId: job?.workflowId || undefined,
          scheduleId: this.schedule?.id!,
          action: SCHEDULE_LOG_ACTION.JOB_TIMEOUT,
        });
        return;
      }
    }, 60000);

    while (workflow.monitor.isRunning) {
      await sleep(1000);
    }
    clearInterval(checkTimeoutInterval);

    if (!isJobTimeout) {
      await appLogDB.createAppLog({
        logType: AppLogType.SCHEDULE,
        campaignId: job?.campaignId || undefined,
        workflowId: job?.workflowId || undefined,
        scheduleId: this.schedule?.id!,
        action: SCHEDULE_LOG_ACTION.JOB_COMPLETED,
      });
      logEveryWhere({
        workflowId: job?.workflowId || undefined,
        campaignId: job?.campaignId || undefined,
        campaignName: job?.campaign?.name,
        workflowName: job?.workflow?.name,
        message: `job done, schedule: ${this.schedule?.name} - jobId: ${job?.id} - campaign: ${job?.campaign?.name} - workflow: ${job?.workflow?.name}`,
      });
    }
  };
}

export { ScheduleRunner };
