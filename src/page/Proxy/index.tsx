import { useEffect, useState } from "react";
import { Tabs } from "antd";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import { useTranslation } from "@/hook";
import { PageWrapper } from "./style";
import ProxyService from "./ProxyService";
import ProxyIp from "./ProxyIp";

export const VIEW_MODE = {
  LIST_IP: "LIST_IP",
  PROXY_SERVICE: "PROXY_SERVICE",
};

const ManageProxy = (props: any) => {
  const [viewMode, setViewMode] = useState(VIEW_MODE.PROXY_SERVICE);

  const { translate } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;
  const { mode } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.proxy"));
  }, [translate]);

  useEffect(() => {
    setViewMode(
      mode && mode !== "undefined" ? mode?.toString() : VIEW_MODE.PROXY_SERVICE
    );
  }, [mode]);

  const onChangeViewMode = (mode: any) => {
    navigate(`/dashboard/proxy?mode=${mode}`);
  };

  return (
    <PageWrapper>
      <title>{translate("sidebar.proxy")}</title>

      <div className="tab">
        <Tabs
          activeKey={viewMode}
          items={[
            {
              key: VIEW_MODE.PROXY_SERVICE,
              label: translate("proxy.rotateProxy"),
            },
            {
              key: VIEW_MODE.LIST_IP,
              label: translate("proxy.staticProxy"),
            },
          ]}
          onChange={onChangeViewMode}
          moreIcon={false}
        />
      </div>

      {viewMode === VIEW_MODE.LIST_IP ? <ProxyIp /> : <ProxyService />}
    </PageWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  ManageProxy
);
