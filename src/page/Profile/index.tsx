import { useState, useEffect } from "react";
import { Tabs } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { connect } from "react-redux";
import { actSetPageName } from "@/redux/layout";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { PageWrapper } from "./style";
import ProfileGroup from "./ProfileGroup";
import ManageProfile from "./ManageProfile";

export const VIEW_MODE = {
  PROFILE: "PROFILE",
  PROFILE_GROUP: "PROFILE_GROUP",
};

const ProfilePage = (props: any) => {
  const [viewMode, setViewMode] = useState(VIEW_MODE.PROFILE_GROUP);
  const location = useLocation();
  const { search } = location;
  const { mode, groupID, groupMode } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });
  const navigate = useNavigate();
  const { translate } = useTranslation();

  useEffect(() => {
    props?.actSetPageName("Profile");
  }, []);

  useEffect(() => {
    setViewMode(
      mode && mode !== "undefined" ? mode?.toString() : VIEW_MODE.PROFILE_GROUP
    );
  }, [mode]);

  const onChangeViewMode = (mode: any) => {
    navigate(
      `/dashboard/profile?group=${groupID}&mode=${mode}&groupMode=${groupMode}`
    );
  };

  return (
    <PageWrapper>
      <title>Profile</title>

      <div className="tab">
        <Tabs
          activeKey={viewMode}
          items={[
            {
              key: VIEW_MODE.PROFILE_GROUP,
              label: translate("profile.profileGroup"),
            },
            {
              key: VIEW_MODE.PROFILE,
              label: translate("profile.allProfile"),
            },
          ]}
          onChange={onChangeViewMode}
        />
      </div>

      {viewMode === VIEW_MODE.PROFILE ? <ManageProfile /> : <ProfileGroup />}
    </PageWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  ProfilePage
);
