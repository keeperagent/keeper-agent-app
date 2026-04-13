import { Fragment } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import {
  HomeIcon,
  ObjectGroupIcon,
  ScriptIcon,
  LinkIcon,
  DoubleRightArrowIcon,
  DoubleLeftArrowIcon,
  WalletIcon,
  MixIcon,
  RocketIcon,
  PreferencesIcon,
  ClockIcon,
  LookupIcon,
  SearchIcon,
  AgentIcon,
  SpiderIcon,
  DistributeIcon,
} from "@/component/Icon";
import { RootState } from "@/redux/store";
import logoUrl from "@/asset/logo.ico";
import { actSetModalGlobalSearchOpen, actSetSidebarOpen } from "@/redux/layout";
import { useTranslation } from "@/hook";
import { SearchInput } from "@/component/Input";
import { SidebarWrapper } from "./style";
import MenuItem from "./MenuItem";

interface IProps {
  isSidebarOpen: boolean;
  actSetModalGlobalSearchOpen: (payload: boolean) => void;
  actSetSidebarOpen: (payload: boolean) => void;
}

interface SidebarContentProps {
  isSidebarOpen: boolean;
  translate: (key: string) => string;
  onOpenGlobalSearch: () => void;
}

const SidebarContent = ({
  isSidebarOpen,
  translate,
  onOpenGlobalSearch,
}: SidebarContentProps) => (
  <Fragment>
    <Link to="/dashboard/home">
      <div className="logo-wrapper">
        <img className="logo" src={logoUrl} alt="" />

        <div className="text">
          <div style={{ marginBottom: "0.3rem" }}>Keeper</div>
          <div>Agent</div>
        </div>
      </div>
    </Link>

    <div className="utils">
      <div
        className="global-search"
        style={{
          padding: isSidebarOpen ? "0" : "0 0.8rem",
        }}
      >
        <div className="overlay" onClick={onOpenGlobalSearch} />

        {isSidebarOpen ? (
          <SearchInput
            onChange={() => {}}
            value={""}
            placeholder={translate("button.search")}
            style={{
              width: "100%",
            }}
          />
        ) : (
          <div
            className="search-icon"
            style={{
              padding: isSidebarOpen ? "1rem 1rem" : "1.3rem 1.45rem",
            }}
          >
            <SearchIcon />
          </div>
        )}
      </div>
    </div>

    <ul className="menu">
      <MenuItem
        label={translate("sidebar.dashboard")}
        icon={<HomeIcon />}
        url="/dashboard/home"
      />

      <MenuItem
        label={translate("sidebar.askAgent")}
        icon={<AgentIcon />}
        url="/dashboard/ask-agent"
      />

      <MenuItem
        label={translate("sidebar.agentHub")}
        icon={<SpiderIcon />}
        url="/dashboard/agent-hub"
      />

      <MenuItem
        label={translate("sidebar.agentTask")}
        icon={<DistributeIcon />}
        url="/dashboard/agent-task"
      />

      <MenuItem
        label={translate("sidebar.wallet")}
        icon={<WalletIcon />}
        url="/dashboard/wallet"
      />

      <MenuItem
        label={translate("sidebar.resources")}
        icon={<ObjectGroupIcon />}
        url="/dashboard/resource"
      />

      <MenuItem label="Profile" icon={<MixIcon />} url="/dashboard/profile" />

      <MenuItem
        label={translate("sidebar.workflow")}
        icon={<ScriptIcon />}
        url="/dashboard/workflow"
      />

      <MenuItem
        label={translate("sidebar.campaign")}
        icon={<RocketIcon />}
        url="/dashboard/campaign"
      />

      <MenuItem
        label={translate("sidebar.schedule")}
        icon={<ClockIcon />}
        url="/dashboard/schedule"
      />

      <MenuItem
        label={translate("sidebar.activityLog")}
        icon={<LookupIcon />}
        url="/dashboard/activity-log"
      />

      <MenuItem
        label={translate("sidebar.connections")}
        icon={<LinkIcon />}
        url="/dashboard/connections"
      />

      <MenuItem
        label={translate("sidebar.preference")}
        icon={<PreferencesIcon />}
        url="/dashboard/setting"
      />
    </ul>
  </Fragment>
);

const Sidebar = (props: IProps) => {
  const { isSidebarOpen } = props;
  const { translate } = useTranslation();

  const onToggleSideBar = () => {
    props?.actSetSidebarOpen(!isSidebarOpen);
  };

  const onOpenGlobalSearch = () => {
    props?.actSetModalGlobalSearchOpen(true);
  };

  return (
    <SidebarWrapper className={!isSidebarOpen ? "close" : ""}>
      <SidebarContent
        isSidebarOpen={isSidebarOpen}
        translate={translate}
        onOpenGlobalSearch={onOpenGlobalSearch}
      />

      <div className="toggle" onClick={onToggleSideBar}>
        <div className="icon">
          {isSidebarOpen ? <DoubleLeftArrowIcon /> : <DoubleRightArrowIcon />}
        </div>

        <div className="version">Version: 1.0.0</div>
      </div>
    </SidebarWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isSidebarOpen: state.Layout?.isSidebarOpen,
  }),
  {
    actSetSidebarOpen,
    actSetModalGlobalSearchOpen,
  },
)(Sidebar);
