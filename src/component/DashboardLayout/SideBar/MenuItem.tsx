import { ReactNode } from "react";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { actSetSidebarOpen } from "@/redux/layout";
import { MenuItemWrapper } from "./style";
import { formatPathName } from "./util";
import BeforeRouteChangeBlocker from "../../BeforeRouteChangeBlocker";

interface MenuItemProps {
  label: string;
  icon: ReactNode;
  notification?: string;
  notificationColor?: string;
  url: string;
  isSidebarOpen?: boolean;
  isLightMode?: boolean;
  actSetSidebarOpen?: any;
}

const MenuItem = (props: MenuItemProps) => {
  const { label, icon: Icon, url, isSidebarOpen, isLightMode } = props;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const active = formatPathName(url) === pathname;

  const onClick = () => {
    navigate(url);
  };

  return (
    <BeforeRouteChangeBlocker onClick={onClick}>
      <MenuItemWrapper
        className={active ? "menu-item-wrapper active" : "menu-item-wrapper"}
        isLightMode={isLightMode}
        isSidebarOpen={isSidebarOpen}
      >
        <div className="menu-item single">
          <span className="menu-item__icon">{Icon}</span>

          {isSidebarOpen ? (
            <span className="menu-item__label">{label}</span>
          ) : null}
        </div>
      </MenuItemWrapper>
    </BeforeRouteChangeBlocker>
  );
};

export default connect(
  (state: RootState) => ({
    isSidebarOpen: state.Layout.isSidebarOpen,
    isLightMode: state.Layout.isLightMode,
  }),
  { actSetSidebarOpen },
)(MenuItem);
