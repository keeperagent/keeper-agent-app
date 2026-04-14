import { DataTypes, Sequelize } from "sequelize";
import sqlite3 from "@vscode/sqlite3";
import { runMigration } from "./migration";
import { getDbPath } from "./common";
import { logEveryWhere } from "@/electron/service/util";

// Static imports for model factories
import campaignFactory from "./model/campaign";
import workflowFactory from "./model/workflow";
import profileGroupFactory from "./model/profileGroup";
import campaignProfileFactory from "./model/campaignProfile";
import resourceFactory from "./model/resource";
import walletFactory from "./model/wallet";
import walletGroupFactory from "./model/walletGroup";
import nodeEndpointFactory from "./model/nodeEndpoint";
import nodeEndpointGroupFactory from "./model/nodeEndpointGroup";
import profileFactory from "./model/profile";
import extensionFactory from "./model/extension";
import resourceGroupFactory from "./model/resourceGroup";
import staticProxyFactory from "./model/staticProxy";
import staticProxyGroupFactory from "./model/staticProxyGroup";
import proxyFactory from "./model/proxy";
import scheduleFactory from "./model/schedule";
import jobFactory from "./model/job";
import mcpServerFactory from "./model/mcpServer";
import agentSkillFactory from "./model/agentSkill";
import settingFactory from "./model/setting";
import chatHistoryFactory from "./model/chatHistory";
import nodeSecretFactory from "./model/nodeSecret";
import agentProfileFactory from "./model/agentProfile";
import agentTaskFactory from "./model/agentTask";
import agentMailboxFactory from "./model/agentMailbox";
import appLogFactory from "./model/appLog";

logEveryWhere({ message: `DB_PATH: ${getDbPath()}` });

const db = new Sequelize({
  dialect: "sqlite",
  dialectModule: sqlite3,
  storage: getDbPath(),
  query: { nest: true },
  logging: false,
});

// Initialize models with db instance
export const CampaignModel = campaignFactory(db);
export const WorkflowModel = workflowFactory(db);
export const ProfileGroupModel = profileGroupFactory(db);
export const CampaignProfileModel = campaignProfileFactory(db);
export const ResourceModel = resourceFactory(db);
export const WalletModel = walletFactory(db);
export const WalletGroupModel = walletGroupFactory(db);
export const NodeEndpointModel = nodeEndpointFactory(db);
export const NodeEndpointGroupModel = nodeEndpointGroupFactory(db);
export const ProfileModel = profileFactory(db);
export const ExtensionModel = extensionFactory(db);
export const ResourceGroupModel = resourceGroupFactory(db);
export const StaticProxyModel = staticProxyFactory(db);
export const StaticProxyGroupModel = staticProxyGroupFactory(db);
export const ProxyModel = proxyFactory(db);
export const ScheduleModel = scheduleFactory(db);
export const JobModel = jobFactory(db);
export const McpServerModel = mcpServerFactory(db);
export const AgentSkillModel = agentSkillFactory(db);
export const SettingModel = settingFactory(db);
export const ChatHistoryModel = chatHistoryFactory(db);
export const NodeSecretModel = nodeSecretFactory(db);
export const AgentProfileModel = agentProfileFactory(db);
export const AgentTaskModel = agentTaskFactory(db);
export const AgentMailboxModel = agentMailboxFactory(db);
export const AppLogModel = appLogFactory(db);

// @CampaignModel -> @ProfileGroupModel
CampaignModel.belongsTo(ProfileGroupModel, {
  foreignKey: { name: "profileGroupId", allowNull: true },
  as: "profileGroup",
  constraints: true,
  onDelete: "CASCADE",
});

// @CampaignModel -> @StaticProxyGroupModel
CampaignModel.belongsTo(StaticProxyGroupModel, {
  foreignKey: { name: "proxyGroupId", allowNull: true },
  as: "proxyGroup",
  constraints: true,
  onDelete: "CASCADE",
});

// junction table for Campaign and Workflow
const Campaign_Workflow = db.define(
  "Campaign_Workflow",
  {
    campaignId: { type: DataTypes.INTEGER, primaryKey: true },
    workflowId: { type: DataTypes.INTEGER, primaryKey: true },
  },
  { tableName: "Campaign_Workflows", timestamps: false },
);
CampaignModel.belongsToMany(WorkflowModel, {
  through: Campaign_Workflow,
  foreignKey: "campaignId",
  constraints: true,
  onDelete: "CASCADE",
});
WorkflowModel.belongsToMany(CampaignModel, {
  through: Campaign_Workflow,
  foreignKey: "workflowId",
  constraints: true,
  onDelete: "CASCADE",
});

// junction table for Campaign and CampaignProfile. A campaign can pick some CampaignProfile to run instead of all CampaignProfile
const Campaign_CampaignProfile = db.define(
  "Campaign_CampaignProfile",
  {},
  { timestamps: false },
);
CampaignModel.belongsToMany(CampaignProfileModel, {
  through: Campaign_CampaignProfile,
  foreignKey: "campaignId",
  constraints: true,
  onDelete: "CASCADE",
});
CampaignProfileModel.belongsToMany(CampaignModel, {
  through: Campaign_CampaignProfile,
  foreignKey: "campaignProfileId",
  constraints: true,
  onDelete: "CASCADE",
});

// @CampaignProfileModel
// junction table for CampaignProfile and Resource
const CampaignProfile_Resource = db.define(
  "CampaignProfile_Resource",
  {},
  { timestamps: false },
);
CampaignProfileModel.belongsToMany(ResourceModel, {
  through: CampaignProfile_Resource,
  foreignKey: "campaignProfileId",
  constraints: true,
  onDelete: "CASCADE",
});
ResourceModel.belongsToMany(CampaignProfileModel, {
  through: CampaignProfile_Resource,
  foreignKey: "resourceId",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key CampaignProfile -> Campaign
CampaignProfileModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: false },
  as: "campaign",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key CampaignProfile -> Wallet
CampaignProfileModel.belongsTo(WalletModel, {
  foreignKey: { name: "walletId", allowNull: true },
  as: "wallet",
  constraints: true,
  onDelete: "CASCADE",
});

CampaignProfileModel.belongsTo(StaticProxyModel, {
  foreignKey: { name: "proxyId", allowNull: true },
  as: "proxy",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key CampaignProfile -> WalletGroup
CampaignProfileModel.belongsTo(WalletGroupModel, {
  foreignKey: { name: "walletGroupId", allowNull: true },
  as: "walletGroup",
  constraints: true,
  onDelete: "CASCADE",
});

// @NodeEndpointModel
// declare foreign key Profile -> ProfileGroup
NodeEndpointModel.belongsTo(NodeEndpointGroupModel, {
  foreignKey: { name: "groupId", allowNull: false },
  as: "group",
  constraints: true,
  onDelete: "CASCADE",
});

// @ProfileModel
// junction table for Profile and Resource
export const Profile_Resource = db.define(
  "Profile_Resource",
  {},
  { timestamps: false },
);
ProfileModel.belongsToMany(ResourceModel, {
  through: Profile_Resource,
  foreignKey: "profileId",
  constraints: true,
  onDelete: "CASCADE",
});
ResourceModel.belongsToMany(ProfileModel, {
  through: Profile_Resource,
  foreignKey: "resourceId",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key Profile -> ProfileGroup
ProfileModel.belongsTo(ProfileGroupModel, {
  foreignKey: { name: "groupId", allowNull: false },
  as: "group",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key Profile -> Wallet
ProfileModel.belongsTo(WalletModel, {
  foreignKey: { name: "walletId", allowNull: true },
  as: "wallet",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key Profile -> WalletGroup
ProfileModel.belongsTo(WalletGroupModel, {
  foreignKey: { name: "walletGroupId", allowNull: true },
  as: "walletGroup",
  constraints: true,
  onDelete: "CASCADE",
});

// declare foreign key ProfileGroup -> WalletGroup
ProfileGroupModel.belongsTo(WalletGroupModel, {
  foreignKey: { name: "walletGroupId", allowNull: true },
  as: "walletGroup",
  constraints: true,
  onDelete: "CASCADE",
});

// junction table for ProfileGroup and ResourceGroup
const Profile_ResourceGroup = db.define(
  "Profile_ResourceGroup",
  {},
  { timestamps: false },
);
ProfileGroupModel.belongsToMany(ResourceGroupModel, {
  through: Profile_ResourceGroup,
  foreignKey: "profileGroupId",
  constraints: true,
  onDelete: "CASCADE",
});
ResourceGroupModel.belongsToMany(ProfileGroupModel, {
  through: Profile_ResourceGroup,
  foreignKey: "resourceGroupId",
  constraints: true,
  onDelete: "CASCADE",
});

// @StaticProxyModel
// declare foreign key StaticProxy -> StaticProxyGroup
StaticProxyModel.belongsTo(StaticProxyGroupModel, {
  foreignKey: { name: "groupId", allowNull: false },
  as: "group",
  constraints: true,
  onDelete: "CASCADE",
});

// @ResourceModel
// declare foreign key
ResourceModel.belongsTo(ResourceGroupModel, {
  foreignKey: { name: "groupId", allowNull: false },
  as: "group",
  constraints: true,
  onDelete: "CASCADE",
});

// @WalletModel
// declare foreign key
WalletModel.belongsTo(WalletGroupModel, {
  foreignKey: { name: "groupId", allowNull: true },
  as: "group",
  constraints: true,
  onDelete: "CASCADE",
});

export const Schedule_Job = db.define(
  "Schedule_Job",
  {},
  { timestamps: false },
);
JobModel.belongsToMany(ScheduleModel, {
  through: Schedule_Job,
  foreignKey: "jobId",
  constraints: true,
  onDelete: "CASCADE",
});
ScheduleModel.belongsToMany(JobModel, {
  through: Schedule_Job,
  foreignKey: "scheduleId",
  constraints: true,
  onDelete: "CASCADE",
});

// @JobModel
// declare foreign key Job -> Workflow (nullable: agent jobs have no workflowId)
JobModel.belongsTo(WorkflowModel, {
  foreignKey: { name: "workflowId", allowNull: true },
  as: "workflow",
  constraints: false,
});
JobModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: false,
});

// @JobModel -> @AgentProfileModel
JobModel.belongsTo(AgentProfileModel, {
  foreignKey: { name: "agentProfileId", allowNull: true },
  as: "agentProfile",
  constraints: false,
});

// @AgentProfileModel -> @CampaignModel
AgentProfileModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: false,
});

// @AgentMailboxModel -> @AgentProfileModel (fromAgent)
AgentMailboxModel.belongsTo(AgentProfileModel, {
  foreignKey: { name: "fromAgentId", allowNull: true },
  as: "fromAgent",
  constraints: false,
});

// @AgentMailboxModel -> @AgentProfileModel (toAgent)
AgentMailboxModel.belongsTo(AgentProfileModel, {
  foreignKey: { name: "toAgentId", allowNull: true },
  as: "toAgent",
  constraints: false,
});

// @AgentTaskModel -> @AgentProfileModel (assignedAgent)
AgentTaskModel.belongsTo(AgentProfileModel, {
  foreignKey: { name: "assignedAgentId", allowNull: true },
  as: "assignedAgent",
  constraints: false,
});

// @AgentTaskModel -> @AgentProfileModel (creatorAgent)
AgentTaskModel.belongsTo(AgentProfileModel, {
  foreignKey: { name: "creatorAgentId", allowNull: true },
  as: "creatorAgent",
  constraints: false,
});

// @AppLogModel
AppLogModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: false,
});
AppLogModel.belongsTo(WorkflowModel, {
  foreignKey: { name: "workflowId", allowNull: true },
  as: "workflow",
  constraints: false,
});
AppLogModel.belongsTo(ScheduleModel, {
  foreignKey: { name: "scheduleId", allowNull: true },
  as: "schedule",
  constraints: false,
});

/** Resolves when the database is ready (authenticate, sync, migrations done). Use to gate UI or main process until DB is loaded. */
export const dbReady: Promise<void> = (async () => {
  try {
    await db.authenticate();
    logEveryWhere({ message: "Connection has been established successfully." });
  } catch (error: any) {
    logEveryWhere({
      message: `Unable to connect to the database: ${error?.message}`,
    });
  }

  try {
    await db.sync();
  } catch (err: any) {
    logEveryWhere({ message: `migrateDB() error: ${err}` });
  }

  await runMigration();
  logEveryWhere({ message: `list model: ${Object.keys(db.models)}` });
})();

export { db };
