import { useEffect, useState } from "react";
import { Tabs } from "antd";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import { useTranslation } from "@/hook";
import { SchedulePageWrapper } from "./style";
import ManageSchedule from "./ManageSchedule";
import Log from "./Log";

export const VIEW_MODE = {
  MANAGE_SCHEDULE: "MANAGE_SCHEDULE",
  LOG: "LOG",
};

const SchedulePage = (props: any) => {
  const [viewMode, setViewMode] = useState(VIEW_MODE.MANAGE_SCHEDULE);
  const location = useLocation();
  const { search } = location;
  const { translate } = useTranslation();
  const { mode } = qs.parse(search, { ignoreQueryPrefix: true });
  const navigate = useNavigate();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.schedule"));
  }, [translate]);

  useEffect(() => {
    setViewMode(
      mode && mode !== "undefined"
        ? mode?.toString()
        : VIEW_MODE.MANAGE_SCHEDULE
    );
  }, [mode]);

  const onChangeViewMode = (mode: any) => {
    navigate(`/dashboard/schedule?mode=${mode}`);
    setViewMode(mode);
  };

  return (
    <SchedulePageWrapper>
      <div className="tab">
        <Tabs
          activeKey={viewMode}
          items={[
            {
              key: VIEW_MODE.MANAGE_SCHEDULE,
              label: translate("sidebar.schedule"),
            },
            {
              key: VIEW_MODE.LOG,
              label: "Log",
            },
          ]}
          onChange={onChangeViewMode}
        />
      </div>

      {viewMode === VIEW_MODE.MANAGE_SCHEDULE && <ManageSchedule />}
      {viewMode === VIEW_MODE.LOG && <Log />}
    </SchedulePageWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  SchedulePage
);
