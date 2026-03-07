import { walletGroupDB } from "@/electron/database/walletGroup";
import { walletDB } from "@/electron/database/wallet";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { profileDB } from "@/electron/database/profile";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { resourceDB } from "@/electron/database/resource";
import { campaignDB } from "@/electron/database/campaign";
import { workflowDB } from "@/electron/database/workflow";
import { agentSkillDB } from "@/electron/database/agentSkill";
import { mcpServerDB } from "@/electron/database/mcpServer";
import { IStatistic } from "@/electron/type";

const countTotalData = async (): Promise<[IStatistic | null, Error | null]> => {
  try {
    const [totalWalletGroup] = await walletGroupDB.totalData();
    const [totalWallet] = await walletDB.totalData();
    const [totalProfileGroup] = await profileGroupDB.totalData();
    const [totalProfile] = await profileDB.totalData();
    const [totalResourceGroup] = await resourceGroupDB.totalData();
    const [totalResource] = await resourceDB.totalData();
    const [totalCampaign] = await campaignDB.totalData();
    const [totalWorkflow] = await workflowDB.totalData();
    const [totalMcpServer] = await mcpServerDB.totalData();
    const [totalAgentSkill] = await agentSkillDB.totalData();

    return [
      {
        totalWalletGroup: totalWalletGroup || 0,
        totalWallet: totalWallet || 0,
        totalProfileGroup: totalProfileGroup || 0,
        totalProfile: totalProfile || 0,
        totalResourceGroup: totalResourceGroup || 0,
        totalResource: totalResource || 0,
        totalCampaign: totalCampaign || 0,
        totalWorkflow: totalWorkflow || 0,
        totalMcpServer: totalMcpServer || 0,
        totalAgentSkill: totalAgentSkill || 0,
      },
      null,
    ];
  } catch (err: any) {
    return [null, err];
  }
};

export { countTotalData };
