import { useEffect, Fragment } from "react";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { connect } from "react-redux";
import { actSetPageName } from "@/redux/layout";
import { RootState } from "@/redux/store";
import { useGetOneCampaign, useTranslation } from "@/hook";
import { CAMPAIGN_VIEW_MODE } from "@/config/constant";
import CampaignView from "./CampaignView";
import ProfileView from "./ProfileView";
import WorkflowView from "./WorkflowView";

const ManageCampaign = (props: any) => {
  const location = useLocation();
  const { search } = location;
  const { mode, campaignId } = qs.parse(search, { ignoreQueryPrefix: true });

  const { translate } = useTranslation();
  const { getOneCampaign } = useGetOneCampaign();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.campaign"));
  }, [translate]);

  useEffect(() => {
    if (campaignId) {
      getOneCampaign(Number(campaignId?.toString()));
    }
  }, [campaignId]);

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
