import { useState, useEffect, ReactNode } from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { useLocation, useNavigate } from "react-router-dom";
import { DownArrowIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { actSetSidebarOpen } from "@/redux/layout";
import { MenuItemWrapper } from "./style";
import { formatPathName } from "./util";

interface SubMenuChild {
  label: string;
  url: string;
}

interface SubMenuItemProps {
  label: string;
  icon: ReactNode;
  listChildMenu: SubMenuChild[];
  isSidebarOpen?: boolean;
  isLightMode?: boolean;
  actSetSidebarOpen?: any;
}

const SubMenuItem = (props: SubMenuItemProps) => {
  const {
    label,
    icon: MenuIcon,
    listChildMenu,
    isSidebarOpen,
    isLightMode,
  } = props;
  const [menuClassname, setMenuClassname] = useState("menu-item-wrapper");
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const active = _.find(
    listChildMenu?.map((item: any) => ({
      ...item,
      url: formatPathName(item?.url),
    })),
    { url: pathname },
  );

  useEffect(() => {
    if (active) {
      setMenuClassname("menu-item-wrapper active show-menu");
    }
  }, [active, setMenuClassname]);

  const onShowMenu = () => {
    if (menuClassname.includes("show-menu")) {
      setMenuClassname(
        active ? "menu-item-wrapper active" : "menu-item-wrapper",
      );
    } else {
      setMenuClassname(
        active
          ? "menu-item-wrapper show-menu active"
          : "menu-item-wrapper show-menu",
      );
    }
  };

  const onChangeRoute = (url: string) => {
    navigate(url);
  };

  const renderListSubMenu = () =>
    listChildMenu.map((childMenu: SubMenuChild, index: number) => (
      <li
        key={index}
        onClick={() => onChangeRoute(childMenu.url)}
        style={{
          color:
            pathname === formatPathName(childMenu.url)
              ? "var(--color-primary-light)"
              : "",
        }}
      >
        <span>{childMenu.label}</span>
      </li>
    ));

  return (
    <MenuItemWrapper
      className={menuClassname}
      isLightMode={isLightMode}
      isSidebarOpen={isSidebarOpen}
    >
      <div className="sub-menu-item" onClick={onShowMenu}>
        <div className="menu-item">
          <span className="menu-item__icon">{MenuIcon}</span>

          {isSidebarOpen ? (
            <span className="menu-item__label">{label}</span>
          ) : null}
        </div>

        <div className="icon-wrapper">
          <DownArrowIcon />
        </div>
      </div>

      <ul className="sub-menu">
        {!isSidebarOpen ? (
          <li className="sub-menu__name category">{label}</li>
        ) : null}

        {renderListSubMenu()}
      </ul>
    </MenuItemWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isSidebarOpen: state.Layout.isSidebarOpen,
    isLightMode: state.Layout.isLightMode,
  }),
  { actSetSidebarOpen },
)(SubMenuItem);
