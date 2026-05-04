import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { actSetMasterKeyUnlocked } from "@/redux/session";
import { getTranslateContent } from "@/service/util";
import { useTranslation } from "@/hook";
import { UserInfoWrapper } from "./style";

const UserInfo = (props: any) => {
  const { user } = props;
  const navigate = useNavigate();
  const { locale } = useTranslation();

  const onLogout = () => {
    navigate("/logout");
  };

  const onGoToSetting = () => {
    navigate("/dashboard/setting");
  };

  const onLockScreen = () => {
    props.actSetMasterKeyUnlocked(false);
    navigate("/master-password");
  };

  const items: MenuProps["items"] = [
    {
      key: "logout",
      label: "Log out",
      onClick: onLogout,
    },
    {
      key: "lockscreen",
      label: "Lock screen",
      onClick: onLockScreen,
    },
    {
      key: "setting",
      label: "Settings",
      onClick: onGoToSetting,
    },
  ];

  const displayName = user?.username || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const tierName =
    getTranslateContent(user?.tierStatus?.pricingTier?.name, locale) || "";

  return (
    <UserInfoWrapper>
      <Dropdown
        menu={{ items }}
        placement="bottomLeft"
        styles={{ root: { minWidth: 150 } }}
      >
        <div className="user" data-tut="reactour-step-4">
          <div className="user-avatar">{initial}</div>
          {displayName && <span className="user-name">{displayName}</span>}
          {tierName && <span className="user-tier">{tierName}</span>}
        </div>
      </Dropdown>
    </UserInfoWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    user: state?.Auth?.user,
  }),
  { actSetMasterKeyUnlocked },
)(UserInfo);
