import { useState, useEffect } from "react";
import { Tabs } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import { useTranslation } from "@/hook";
import ResourceGroup from "./ResourceGroup";
import ManageResource from "./ManageResource";
import { PageWrapper } from "./style";

export const VIEW_MODE = {
  RESOURCE: "RESOURCE",
  RESOURCE_GROUP: "RESOURCE_GROUP",
};

const WalletPage = (props: any) => {
  const { translate } = useTranslation();
  const [viewMode, setViewMode] = useState(VIEW_MODE.RESOURCE_GROUP);
  const location = useLocation();
  const { search } = location;
  const { mode, groupID } = qs.parse(search, { ignoreQueryPrefix: true });
  const navigate = useNavigate();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.resources"));
  }, [translate]);

  useEffect(() => {
    setViewMode(
      mode && mode !== "undefined" ? mode?.toString() : VIEW_MODE.RESOURCE_GROUP
    );
  }, [mode]);

  const onChangeViewMode = (mode: any) => {
    navigate(`/dashboard/resource?group=${groupID}&mode=${mode}`);
  };

  return (
    <PageWrapper>
      <title>{translate("sidebar.resources")}</title>

      <div className="tab">
        <Tabs
          activeKey={viewMode}
          items={[
            {
              key: VIEW_MODE.RESOURCE_GROUP,
              label: translate("resource.resourceGroup"),
            },
            {
              key: VIEW_MODE.RESOURCE,
              label: translate("resource.resource"),
            },
          ]}
          onChange={onChangeViewMode}
        />
      </div>

      {viewMode === VIEW_MODE.RESOURCE ? <ManageResource /> : <ResourceGroup />}
    </PageWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  WalletPage
);
