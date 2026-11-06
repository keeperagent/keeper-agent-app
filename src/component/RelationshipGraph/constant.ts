import { IGraphNodeType } from "@/electron/type";

export type ICategoryConfig = {
  type: IGraphNodeType;
  labelKey: string;
  colorLight: string;
  colorDark: string;
};

// Rainbow sweep, not color-coded by meaning. colorLight/colorDark are tuned
// per-hue (not a fixed lightness offset) so each clears WCAG contrast.
export const CATEGORY_LIST: ICategoryConfig[] = [
  {
    type: "WALLET",
    labelKey: "home.numberWallet",
    colorLight: "#e641ec",
    colorDark: "#dc16e3",
  },
  {
    type: "WALLET_GROUP",
    labelKey: "home.numberWalletGroup",
    colorLight: "#ee4f9d",
    colorDark: "#ea2a88",
  },
  {
    type: "CAMPAIGN",
    labelKey: "home.numberCampaign",
    colorLight: "#ee5b53",
    colorDark: "#eb3d33",
  },
  {
    type: "WORKFLOW",
    labelKey: "home.numberWorkflow",
    colorLight: "#c37c13",
    colorDark: "#b07111",
  },
  // No existing "Agent"/"Agent Task"/"Schedule" entity-name label elsewhere
  // in the app (checked en.json) — these stay their own keys.
  {
    type: "AGENT",
    labelKey: "relationshipGraph.category.agent",
    colorLight: "#81950f",
    colorDark: "#8da210",
  },
  {
    type: "AGENT_TASK",
    labelKey: "relationshipGraph.category.agentTask",
    colorLight: "#3c9e10",
    colorDark: "#3ea210",
  },
  {
    type: "SCHEDULE",
    labelKey: "relationshipGraph.category.schedule",
    colorLight: "#109e7f",
    colorDark: "#10a282",
  },
  {
    type: "MCP_SERVER",
    labelKey: "home.numberMcpServer",
    colorLight: "#1594d1",
    colorDark: "#1386be",
  },
  {
    type: "AGENT_SKILL",
    labelKey: "home.numberAgentSkill",
    colorLight: "#5d6fef",
    colorDark: "#6174ef",
  },
];
