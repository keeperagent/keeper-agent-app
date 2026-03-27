import { lazy } from "react";
import { IRoute } from "./index";

const HomePage = lazy(() => import("@/page/Home"));
const AgentTaskPage = lazy(() => import("@/page/AgentTask"));
const AgentPage = lazy(() => import("@/page/Agent"));
const AgentHubPage = lazy(() => import("@/page/AgentHub"));
const WorkflowPage = lazy(() => import("@/page/Workflow"));
const WalletPage = lazy(() => import("@/page/Wallet"));
const ResourcePage = lazy(() => import("@/page/Resource"));
const ProfilePage = lazy(() => import("@/page/Profile"));
const ExtensionPage = lazy(() => import("@/page/Extension"));
const ProxyPage = lazy(() => import("@/page/Proxy"));
const CampaignPage = lazy(() => import("@/page/Campaign"));
const SettingPage = lazy(() => import("@/page/Setting"));
const LoginPage = lazy(() => import("@/page/Login"));
const LogoutPage = lazy(() => import("@/page/LogoutPage"));
const NodeProviderPage = lazy(() => import("@/page/NodeProvider"));
const ActivityLogPage = lazy(() => import("@/page/ActivityLog"));
const SchedulePage = lazy(() => import("@/page/Schedule"));
const MasterPasswordPage = lazy(() => import("@/page/MasterPassword"));

const routesConfig: IRoute[] = [
  {
    isPrivateRoute: true,
    path: "/dashboard/home",
    element: <HomePage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/agent-task",
    element: <AgentTaskPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/ask-agent",
    element: <AgentPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/agent-hub",
    element: <AgentHubPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/campaign",
    element: <CampaignPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/schedule",
    element: <SchedulePage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/workflow",
    element: <WorkflowPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/wallet",
    element: <WalletPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/resource",
    element: <ResourcePage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/profile",
    element: <ProfilePage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/proxy",
    element: <ProxyPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/extension",
    element: <ExtensionPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/setting",
    element: <SettingPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/activity-log",
    element: <ActivityLogPage />,
  },
  {
    isPrivateRoute: true,
    path: "/dashboard/node-provider",
    element: <NodeProviderPage />,
  },
  {
    isPrivateRoute: false,
    path: "/master-password",
    element: <MasterPasswordPage />,
  },
  {
    isPrivateRoute: false,
    path: "/",
    element: <LoginPage />,
  },
  {
    isPrivateRoute: false,
    path: "/logout",
    element: <LogoutPage />,
  },
];

export { routesConfig };
