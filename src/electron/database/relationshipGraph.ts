import { Model, ModelStatic } from "sequelize";
import {
  AgentProfileModel,
  AgentSkillModel,
  AgentTaskModel,
  CampaignModel,
  CampaignProfileModel,
  JobModel,
  McpServerModel,
  ScheduleModel,
  WalletGroupModel,
  WalletModel,
  WorkflowModel,
} from "./index";
import { logEveryWhere } from "@/electron/service/util";

const findAssociationAlias = (
  sourceModel: ModelStatic<Model>,
  targetModel: ModelStatic<Model>,
): string => {
  const associations = sourceModel.associations || {};
  const alias = Object.keys(associations).find(
    (key) => associations[key].target === targetModel,
  );
  if (!alias) {
    throw new Error(
      `No association found between ${sourceModel.name} and ${targetModel.name}`,
    );
  }
  return alias;
};

class RelationshipGraphDB {
  async getAllWallets(): Promise<[any[] | null, Error | null]> {
    try {
      const wallets = await WalletModel.findAll({
        attributes: ["id", "address", "groupId", "isEncrypted"],
        raw: true,
      });
      return [wallets, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllWallets() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllWalletGroups(): Promise<[any[] | null, Error | null]> {
    try {
      const walletGroups = await WalletGroupModel.findAll({
        attributes: ["id", "name", "portfolioApp"],
        raw: true,
      });
      return [walletGroups, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllWalletGroups() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllCampaigns(): Promise<[any[] | null, Error | null]> {
    try {
      const campaigns = await CampaignModel.findAll({
        attributes: ["id", "name"],
        raw: true,
      });
      return [campaigns, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllCampaigns() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllWorkflows(): Promise<[any[] | null, Error | null]> {
    try {
      const workflows = await WorkflowModel.findAll({
        attributes: ["id", "name"],
        raw: true,
      });
      return [workflows, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllWorkflows() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllAgentProfiles(): Promise<[any[] | null, Error | null]> {
    try {
      const agentProfiles = await AgentProfileModel.findAll({
        attributes: ["id", "name", "allowedMcpServerIds", "allowedSkillIds"],
        raw: true,
      });
      return [agentProfiles, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getAllAgentProfiles() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getAllMcpServers(): Promise<[any[] | null, Error | null]> {
    try {
      const mcpServers = await McpServerModel.findAll({
        attributes: ["id", "name"],
        raw: true,
      });
      return [mcpServers, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllMcpServers() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllAgentSkills(): Promise<[any[] | null, Error | null]> {
    try {
      const agentSkills = await AgentSkillModel.findAll({
        attributes: ["id", "name"],
        raw: true,
      });
      return [agentSkills, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllAgentSkills() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllAgentTasks(): Promise<[any[] | null, Error | null]> {
    try {
      const agentTasks = await AgentTaskModel.findAll({
        attributes: ["id", "title", "assignedAgentId"],
        raw: true,
      });
      return [agentTasks, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllAgentTasks() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getAllSchedules(): Promise<[any[] | null, Error | null]> {
    try {
      const schedules = await ScheduleModel.findAll({
        attributes: ["id", "name"],
        raw: true,
      });
      return [schedules, null];
    } catch (err: any) {
      logEveryWhere({ message: `getAllSchedules() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getCampaignProfileWalletLinks(): Promise<[any[] | null, Error | null]> {
    try {
      const campaignProfiles = await CampaignProfileModel.findAll({
        attributes: ["campaignId", "walletId", "walletGroupId"],
        raw: true,
      });
      return [campaignProfiles, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getCampaignProfileWalletLinks() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  // Returns [{ campaignId, workflowIds: number[] }]
  async getCampaignWorkflowLinks(): Promise<[any[] | null, Error | null]> {
    try {
      const workflowAlias = findAssociationAlias(CampaignModel, WorkflowModel);
      const campaigns = await CampaignModel.findAll({
        attributes: ["id"],
        include: [
          { model: WorkflowModel, attributes: ["id"], as: workflowAlias },
        ],
      });
      return [
        campaigns.map((campaign: any) => ({
          campaignId: campaign.id,
          workflowIds: (campaign[workflowAlias] || []).map(
            (workflow: any) => workflow.id,
          ),
        })),
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `getCampaignWorkflowLinks() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  // Returns [{ scheduleId, jobs: { campaignId, workflowId, agentProfileId }[] }].
  async getScheduleJobLinks(): Promise<[any[] | null, Error | null]> {
    try {
      const jobAlias = findAssociationAlias(ScheduleModel, JobModel);
      const schedules = await ScheduleModel.findAll({
        attributes: ["id"],
        include: [
          {
            model: JobModel,
            as: jobAlias,
            attributes: ["id", "campaignId", "workflowId", "agentProfileId"],
          },
        ],
      });
      return [
        schedules.map((schedule: any) => ({
          scheduleId: schedule.id,
          jobs: (schedule[jobAlias] || []).map((job: any) => ({
            campaignId: job.campaignId,
            workflowId: job.workflowId,
            agentProfileId: job.agentProfileId,
          })),
        })),
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `getScheduleJobLinks() error: ${err?.message}`,
      });
      return [null, err];
    }
  }
}

export const relationshipGraphDB = new RelationshipGraphDB();
