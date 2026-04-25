import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { actSetMasterKeyUnlocked } from "@/redux/session";
import userAvatarImg from "@/asset/user-avatar.png";
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

  return (
    <UserInfoWrapper>
      <Dropdown
        menu={{ items }}
        placement="bottomLeft"
        styles={{ root: { minWidth: 150 } }}
      >
        <div className="user" data-tut="reactour-step-4">
          <div className="user-info">
            <div className="user-position">
              {getTranslateContent(
                user?.tierStatus?.pricingTier?.name,
                locale,
              ) || ""}
            </div>
          </div>

          <div className="user-avatar">
            <img src={userAvatarImg} alt="" />
          </div>
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
