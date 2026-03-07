import { useEffect, Fragment, useRef } from "react";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { notification } from "antd";
import { connect } from "react-redux";
import { actSetPageName } from "@/redux/layout";
import { RootState } from "@/redux/store";
import { useGetOneCampaign, useTranslation } from "@/hook";
import { MESSAGE } from "@/electron/constant";
import { CAMPAIGN_VIEW_MODE } from "@/config/constant";
import CampaignView from "./CampaignView";
import ProfileView from "./ProfileView";
import WorkflowView from "./WorkflowView";

const ManageCampaign = (props: any) => {
  const localeRef = useRef<string>("");
  const notiTitleRef = useRef("");
  const location = useLocation();
  const { search } = location;
  const { mode, campaignId } = qs.parse(search, { ignoreQueryPrefix: true });

  const { translate, locale } = useTranslation();
  const { getOneCampaign } = useGetOneCampaign();

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    notiTitleRef.current = translate("notification");
  }, [translate]);

  const openProxyNotification = (totalSecond: number) => {
    notification.info({
      message: notiTitleRef.current,
      description: `Wait ${totalSecond} second${
        totalSecond > 1 ? "s" : ""
      } to get a new IP address`,
    });
  };

  const openProxyWarning = (proxyService: number) => {
    notification.error({
      message: notiTitleRef.current,
      description: `${proxyService}: All api keys are not working`,
    });
  };

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.campaign"));
  }, [translate]);

  useEffect(() => {
    if (campaignId) {
      getOneCampaign(Number(campaignId?.toString()));
    }
  }, [campaignId]);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.WAIT_TO_GET_NEW_PROXY,
      (event: any, payload: any) => {
        const { data } = payload;
        openProxyNotification(data);
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.WAIT_TO_GET_NEW_PROXY);
    };
  }, []);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.ALL_PROXY_API_KEY_INVALID,
      (event: any, payload: any) => {
        const { data } = payload;
        openProxyWarning(data);
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.ALL_PROXY_API_KEY_INVALID);
    };
  }, []);

  switch (mode) {
    case CAMPAIGN_VIEW_MODE.VIEW_PROFILE:
      return (
        <Fragment>
          <ProfileView />
        </Fragment>
      );
    case CAMPAIGN_VIEW_MODE.VIEW_WORKFLOW:
      return (
        <Fragment>
          <WorkflowView />
        </Fragment>
      );
    default:
      return <CampaignView />;
  }
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  ManageCampaign,
);
