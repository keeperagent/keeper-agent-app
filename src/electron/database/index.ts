import { DataTypes, Sequelize } from "sequelize";
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
import proxyIpFactory from "./model/proxyIp";
import proxyIpGroupFactory from "./model/proxyIpGroup";
import preferenceFactory from "./model/preference";
import proxyFactory from "./model/proxy";
import userLogFactory from "./model/userLog";
import scheduleFactory from "./model/schedule";
import scheduleLogFactory from "./model/scheduleLog";
import jobFactory from "./model/job";
import mcpServerFactory from "./model/mcpServer";
import agentSkillFactory from "./model/agentSkill";
import agentSettingFactory from "./model/agentSetting";
import chatHistoryFactory from "./model/chatHistory";
import nodeSecretFactory from "./model/nodeSecret";
import agentRegistryFactory from "./model/agentRegistry";
import mcpTokenFactory from "./model/mcpToken";

logEveryWhere({ message: `DB_PATH: ${getDbPath()}` });

const db = new Sequelize({
  dialect: "sqlite",
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
export const ProxyIpModel = proxyIpFactory(db);
export const ProxyIpGroupModel = proxyIpGroupFactory(db);
export const PreferenceModel = preferenceFactory(db);
export const ProxyModel = proxyFactory(db);
export const UserLogModel = userLogFactory(db);
export const ScheduleModel = scheduleFactory(db);
export const ScheduleLogModel = scheduleLogFactory(db);
export const JobModel = jobFactory(db);
export const McpServerModel = mcpServerFactory(db);
export const AgentSkillModel = agentSkillFactory(db);
export const AgentSettingModel = agentSettingFactory(db);
export const ChatHistoryModel = chatHistoryFactory(db);
export const NodeSecretModel = nodeSecretFactory(db);
export const AgentRegistryModel = agentRegistryFactory(db);
export const McpTokenModel = mcpTokenFactory(db);

// @CampaignModel -> @ProfileGroupModel
CampaignModel.belongsTo(ProfileGroupModel, {
  foreignKey: { name: "profileGroupId", allowNull: true },
  as: "profileGroup",
  constraints: true,
  onDelete: "CASCADE",
});

// @CampaignModel -> @ProxyIpGroupModel
CampaignModel.belongsTo(ProxyIpGroupModel, {
  foreignKey: { name: "proxyIpGroupId", allowNull: true },
  as: "proxyIpGroup",
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

CampaignProfileModel.belongsTo(ProxyIpModel, {
  foreignKey: { name: "proxyIpId", allowNull: true },
  as: "proxyIp",
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

// @ProxyIpModel
// declare foreign key Profile -> ProfileGroup
ProxyIpModel.belongsTo(ProxyIpGroupModel, {
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
  onDelete: "CASCADE",
});
JobModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: false,
  onDelete: "CASCADE",
});

// @JobModel -> @AgentRegistryModel
JobModel.belongsTo(AgentRegistryModel, {
  foreignKey: { name: "agentRegistryId", allowNull: true },
  as: "agentRegistry",
  constraints: false,
});

// @AgentRegistryModel -> @CampaignModel
AgentRegistryModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: false,
});

// @UserLogModel
// declare foreign key UserLogModel -> Workflow
UserLogModel.belongsTo(WorkflowModel, {
  foreignKey: { name: "workflowId", allowNull: true },
  as: "workflow",
  constraints: true,
  onDelete: "CASCADE",
});
UserLogModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: true,
  onDelete: "CASCADE",
});

// @ScheduleLogModel -> @ScheduleModel
ScheduleLogModel.belongsTo(ScheduleModel, {
  foreignKey: { name: "scheduleId", allowNull: false },
  as: "schedule",
  constraints: true,
  onDelete: "CASCADE",
});
// @ScheduleLogModel -> @CampaignModel
ScheduleLogModel.belongsTo(CampaignModel, {
  foreignKey: { name: "campaignId", allowNull: true },
  as: "campaign",
  constraints: false,
  onDelete: "CASCADE",
});
// @ScheduleLogModel -> @WorkflowModel
ScheduleLogModel.belongsTo(WorkflowModel, {
  foreignKey: { name: "workflowId", allowNull: true },
  as: "workflow",
  constraints: false,
  onDelete: "CASCADE",
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
