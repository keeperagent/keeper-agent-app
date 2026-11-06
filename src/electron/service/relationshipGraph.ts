import { relationshipGraphDB } from "@/electron/database/relationshipGraph";
import { logEveryWhere } from "@/electron/service/util";
import { encryptionService } from "@/electron/service/encrypt";
import { IRelationshipGraphData, IGraphEdge, IGraphNode } from "@/electron/type";

const nodeId = (type: IGraphNode["type"], entityId: number | string) =>
  `${type}:${entityId}`;

const parseIdArray = (value: unknown): number[] => {
  if (typeof value !== "string" || !value) {
    return [];
  }
  try {
    return (JSON.parse(value) || []).map((item: any) => Number(item));
  } catch {
    return [];
  }
};

const decryptWalletAddress = (
  address: string,
  isEncrypted: boolean,
  encryptKey?: string,
): string => {
  if (!isEncrypted || !encryptKey) {
    return address;
  }
  const decrypted = encryptionService.decryptData(address, encryptKey);
  return decrypted || address;
};

export const getRelationshipGraph = async (
  encryptKey?: string,
): Promise<[IRelationshipGraphData | null, Error | null]> => {
  try {
    const [
      [wallets, walletsErr],
      [walletGroups, walletGroupsErr],
      [campaigns, campaignsErr],
      [workflows, workflowsErr],
      [agentProfiles, agentProfilesErr],
      [agentTasks, agentTasksErr],
      [schedules, schedulesErr],
      [mcpServers, mcpServersErr],
      [agentSkills, agentSkillsErr],
      [campaignProfileWalletLinks, campaignProfileWalletLinksErr],
      [campaignWorkflowLinks, campaignWorkflowLinksErr],
      [scheduleJobLinks, scheduleJobLinksErr],
    ] = await Promise.all([
      relationshipGraphDB.getAllWallets(),
      relationshipGraphDB.getAllWalletGroups(),
      relationshipGraphDB.getAllCampaigns(),
      relationshipGraphDB.getAllWorkflows(),
      relationshipGraphDB.getAllAgentProfiles(),
      relationshipGraphDB.getAllAgentTasks(),
      relationshipGraphDB.getAllSchedules(),
      relationshipGraphDB.getAllMcpServers(),
      relationshipGraphDB.getAllAgentSkills(),
      relationshipGraphDB.getCampaignProfileWalletLinks(),
      relationshipGraphDB.getCampaignWorkflowLinks(),
      relationshipGraphDB.getScheduleJobLinks(),
    ]);

    const firstError =
      walletsErr ||
      walletGroupsErr ||
      campaignsErr ||
      workflowsErr ||
      agentProfilesErr ||
      agentTasksErr ||
      schedulesErr ||
      mcpServersErr ||
      agentSkillsErr ||
      campaignProfileWalletLinksErr ||
      campaignWorkflowLinksErr ||
      scheduleJobLinksErr;
    if (firstError) {
      return [null, firstError];
    }

    const nodes: IGraphNode[] = [];
    const edges: IGraphEdge[] = [];

    (wallets || []).forEach((wallet) => {
      nodes.push({
        id: nodeId("WALLET", wallet.id),
        type: "WALLET",
        label: decryptWalletAddress(
          wallet.address,
          Boolean(wallet.isEncrypted),
          encryptKey,
        ),
        meta: { isEncrypted: Boolean(wallet.isEncrypted) },
      });
      if (wallet.groupId) {
        edges.push({
          source: nodeId("WALLET", wallet.id),
          target: nodeId("WALLET_GROUP", wallet.groupId),
          type: "MEMBER_OF",
        });
      }
    });

    (walletGroups || []).forEach((walletGroup) => {
      nodes.push({
        id: nodeId("WALLET_GROUP", walletGroup.id),
        type: "WALLET_GROUP",
        label: walletGroup.name,
        meta: { portfolioApp: walletGroup.portfolioApp || null },
      });
    });

    (campaigns || []).forEach((campaign) => {
      nodes.push({
        id: nodeId("CAMPAIGN", campaign.id),
        type: "CAMPAIGN",
        label: campaign.name,
      });
    });

    (workflows || []).forEach((workflow) => {
      nodes.push({
        id: nodeId("WORKFLOW", workflow.id),
        type: "WORKFLOW",
        label: workflow.name,
      });
    });

    (agentProfiles || []).forEach((agentProfile) => {
      nodes.push({
        id: nodeId("AGENT", agentProfile.id),
        type: "AGENT",
        label: agentProfile.name,
      });
      parseIdArray(agentProfile.allowedMcpServerIds).forEach((mcpServerId) => {
        edges.push({
          source: nodeId("AGENT", agentProfile.id),
          target: nodeId("MCP_SERVER", mcpServerId),
          type: "USES_MCP_SERVER",
        });
      });
      parseIdArray(agentProfile.allowedSkillIds).forEach((skillId) => {
        edges.push({
          source: nodeId("AGENT", agentProfile.id),
          target: nodeId("AGENT_SKILL", skillId),
          type: "USES_SKILL",
        });
      });
    });

    (mcpServers || []).forEach((mcpServer) => {
      nodes.push({
        id: nodeId("MCP_SERVER", mcpServer.id),
        type: "MCP_SERVER",
        label: mcpServer.name,
      });
    });

    (agentSkills || []).forEach((agentSkill) => {
      nodes.push({
        id: nodeId("AGENT_SKILL", agentSkill.id),
        type: "AGENT_SKILL",
        label: agentSkill.name,
      });
    });

    (agentTasks || []).forEach((agentTask) => {
      nodes.push({
        id: nodeId("AGENT_TASK", agentTask.id),
        type: "AGENT_TASK",
        label: agentTask.title,
      });
      if (agentTask.assignedAgentId) {
        edges.push({
          source: nodeId("AGENT", agentTask.assignedAgentId),
          target: nodeId("AGENT_TASK", agentTask.id),
          type: "EXECUTES_TASK",
        });
      }
    });

    (schedules || []).forEach((schedule) => {
      nodes.push({
        id: nodeId("SCHEDULE", schedule.id),
        type: "SCHEDULE",
        label: schedule.name,
      });
    });

    const campaignWalletGroupPairs = new Set<string>();
    (campaignProfileWalletLinks || []).forEach((campaignProfile) => {
      if (!campaignProfile.walletGroupId) {
        return;
      }
      const pairKey = `${campaignProfile.campaignId}:${campaignProfile.walletGroupId}`;
      if (campaignWalletGroupPairs.has(pairKey)) {
        return;
      }
      campaignWalletGroupPairs.add(pairKey);
      edges.push({
        source: nodeId("CAMPAIGN", campaignProfile.campaignId),
        target: nodeId("WALLET_GROUP", campaignProfile.walletGroupId),
        type: "USES_WALLET_GROUP",
      });
    });

    (campaignWorkflowLinks || []).forEach((link) => {
      (link.workflowIds || []).forEach((workflowId: number) => {
        edges.push({
          source: nodeId("CAMPAIGN", link.campaignId),
          target: nodeId("WORKFLOW", workflowId),
          type: "RUNS_WORKFLOW",
        });
      });
    });

    (scheduleJobLinks || []).forEach((link) => {
      (link.jobs || []).forEach((job: any) => {
        if (job.campaignId) {
          edges.push({
            source: nodeId("SCHEDULE", link.scheduleId),
            target: nodeId("CAMPAIGN", job.campaignId),
            type: "TRIGGERED_BY",
          });
        }
        if (job.workflowId) {
          edges.push({
            source: nodeId("SCHEDULE", link.scheduleId),
            target: nodeId("WORKFLOW", job.workflowId),
            type: "TRIGGERED_BY",
          });
        }
        if (job.agentProfileId) {
          edges.push({
            source: nodeId("SCHEDULE", link.scheduleId),
            target: nodeId("AGENT", job.agentProfileId),
            type: "TRIGGERED_BY",
          });
        }
      });
    });

    return [{ nodes, edges }, null];
  } catch (err: any) {
    logEveryWhere({ message: `getRelationshipGraph() error: ${err?.message}` });
    return [null, err];
  }
};
