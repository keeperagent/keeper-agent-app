import AsyncLock from "async-lock";
import { Workflow } from "./workflow";
import { currentInstance, CurrentInstance } from "./currentInstance";
import { IRunningWorkflow } from "@/electron/type";
import { jobDB } from "@/electron/database/job";
import { logEveryWhere } from "@/electron/service/util";
import { sleep } from "@/electron/simulator/util";
import { campaignDB } from "@/electron/database/campaign";

// WorkflowManager manage multiple Workflows. Each pair [campaign, workflow] is a standalone Workflow
export class WorkflowManager {
  private mapWorkflow: Map<string, Workflow>;
  private lock: AsyncLock;
  private lockKey: string;
  currentInstance: CurrentInstance;

  constructor() {
    this.mapWorkflow = new Map();
    this.lock = new AsyncLock();
    this.lockKey = "WorkflowManager";
    this.currentInstance = currentInstance;
  }

  stopAllWorkflow = async () => {
    const listResultPromise: Promise<void>[] = [];
    this.mapWorkflow.forEach((workflow) => {
      if (workflow.monitor.isRunning) {
        const resultPromise = workflow.stopWorkflow();
        listResultPromise.push(resultPromise);
      }
    });
    await Promise.all(listResultPromise);
    this.mapWorkflow.clear();
  };

  // only allow one workflow run with browser at single time
  shouldWaitBeforeRun = async (campaignId: number): Promise<boolean> => {
    const [campaign] = await campaignDB.getOneCampaign(campaignId);
    if (!campaign) {
      return false;
    }

    return Boolean(campaign?.isUseBrowser) && workflowManager.isUsingBrowser();
  };

  private isUsingBrowser = (): boolean => {
    let isUsingBrowser = false;
    this.mapWorkflow.forEach((workflow) => {
      if (workflow.monitor.isRunning && workflow.isUsingBrowser()) {
        isUsingBrowser = true;
      }
    });
    return isUsingBrowser;
  };

  startJobWhenOpenApp = async () => {
    const [allJob] = await jobDB.getAllJob([
      {
        isRunWithSchedule: false,
      },
    ]);
    if (!allJob || allJob?.length === 0) {
      return;
    }

    for (const job of allJob) {
      if (
        !job?.workflowId ||
        !job?.campaignId ||
        job.isCompleted ||
        !job.isRunning
      ) {
        continue;
      }

      const workflow = await this.getWorkflow(
        job?.workflowId,
        job?.campaignId,
        job?.scheduleId || 0,
      );
      let encryptKey = "";
      if (job?.hasEncryptKey && job?.id) {
        const [fetchedEncryptKey] = await jobDB.getEncryptKey(job.id);
        encryptKey = fetchedEncryptKey || "";
      }
      workflow.runWorkflow(encryptKey).catch(() => {});
      await sleep(5000);
    }
  };

  getRunningWorkflow = (): IRunningWorkflow[] => {
    const results: IRunningWorkflow[] = [];
    this.mapWorkflow.forEach((workflow) => {
      if (workflow.monitor.isRunning) {
        results.push({
          campaignId: workflow.campaignId,
          workflowId: workflow.workflowId,
          scheduleId: workflow.scheduleId,
        });
      }
    });

    return results;
  };

  totalRunningWorkflow = (): number => {
    return this.getRunningWorkflow()?.length;
  };

  getWorkflow = async (
    workflowId: number = 0,
    campaignId: number = 0,
    scheduleId: number = 0,
  ): Promise<Workflow> => {
    return await this.lock.acquire(this.lockKey, () => {
      const key = this.currentInstance.getWorkflowKey(
        workflowId,
        campaignId,
        scheduleId,
      );
      const workflow = this.mapWorkflow.get(key);

      if (workflow !== undefined) {
        return workflow;
      }

      const newWorkflow = new Workflow(
        workflowId,
        campaignId,
        scheduleId,
        currentInstance,
      );
      this.mapWorkflow.set(key, newWorkflow);
      return newWorkflow;
    });
  };

  clearWorkflow = (
    workflowId: number,
    campaignId: number,
    scheduleId: number,
  ) => {
    this.mapWorkflow.delete(
      this.currentInstance.getWorkflowKey(workflowId, campaignId, scheduleId),
    );
  };
}

const workflowManager = new WorkflowManager();
logEveryWhere({ message: "Start Jobs when app opened" });
workflowManager.startJobWhenOpenApp();
export { workflowManager };
