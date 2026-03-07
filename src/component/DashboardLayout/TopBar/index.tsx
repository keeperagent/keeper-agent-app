import { useEffect, useMemo } from "react";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import qs from "qs";
import ThemeSwitch from "@/component/ThemeSwitch";
import { QuestionIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { ICampaign, IPreference } from "@/electron/type";
import { useHandleWorkflowUsingTelegram, useTranslation } from "@/hook";
import { TELEGRAM_BOT } from "@/electron/constant";
import { actSetModalInstructionOpen } from "@/redux/layout";
import { trimText } from "@/service/util";
import { EMPTY_STRING, CAMPAIGN_VIEW_MODE } from "@/config/constant";
import WorkflowContent from "./WorkflowContent";
import UserInfo from "./UserInfo";
import DownloadBrowser from "./DownloadBrowser";
import ModalInstruction from "./ModalInstruction";
import { TopBarWrapper } from "./style";

type IProps = {
  isFullScreen: boolean;
  isSidebarOpen: boolean;
  pageName: string;
  preference: IPreference | null;
  actSetModalInstructionOpen: (payload: boolean) => void;
  selectedCampaign: ICampaign | null;
  calculatedValue: string;
};

const TopBar = (props: IProps) => {
  const {
    isSidebarOpen,
    isFullScreen,
    pageName,
    preference,
    selectedCampaign,
    calculatedValue,
  } = props;
  const { pathname, search } = useLocation();
  const { workflowId, mode } = qs.parse(search, { ignoreQueryPrefix: true });

  const { onRunWorkflowUsingTelegram, onStopRunWorkflowUsingTelegram } =
    useHandleWorkflowUsingTelegram();
  const { translate } = useTranslation();

  const isWorkflow = useMemo(() => {
    return (
      (pathname === "/dashboard/workflow" ||
        pathname === "/dashboard/campaign") &&
      workflowId !== undefined
    );
  }, [pathname, workflowId]);

  const isShowInstruction = useMemo(() => {
    return [
      "/dashboard/wallet",
      "/dashboard/resource",
      "/dashboard/profile",
      "/dashboard/campaign",
      "/dashboard/workflow",
      "/dashboard/proxy",
      "/dashboard/extension",
      "/dashboard/node-provider",
      "/dashboard/history",
      "/dashboard/schedule",
    ]?.includes(pathname);
  }, [pathname]);

  useEffect(() => {
    window?.electron?.on(
      TELEGRAM_BOT.ACTION_RUN_WORKFLOW_USING_TELEGRAM,
      (event: any, args: any) => {
        onRunWorkflowUsingTelegram(args);
      },
    );
  }, []);

  useEffect(() => {
    window?.electron?.on(
      TELEGRAM_BOT.ACTION_STOP_CAMPAIGN_USING_TELEGRAM,
      () => {
        onStopRunWorkflowUsingTelegram();
      },
    );
  }, []);

  const onOpenModalInstruction = () => {
    props?.actSetModalInstructionOpen(true);
  };

  return (
    <TopBarWrapper
      // @ts-ignore
      isSidebarOpen={isSidebarOpen}
      className={isFullScreen ? "fullscreen" : ""}
    >
      <div className="page-detail">
        {isWorkflow ? (
          <WorkflowContent />
        ) : (
          <div className="heading">
            <span>{pageName}</span>
            {isShowInstruction && (
              <span className="icon" onClick={onOpenModalInstruction}>
                <QuestionIcon />
              </span>
            )}

            {mode === CAMPAIGN_VIEW_MODE.VIEW_PROFILE && (
              <div className="list-info">
                <div className="campaign-info">
                  <div className="label">{`${translate(
                    "sidebar.campaign",
                  )}:`}</div>
                  <div className="value">
                    {trimText(selectedCampaign?.name || EMPTY_STRING, 45)}
                  </div>
                </div>

                {selectedCampaign?.unitForCalculate && (
                  <div className="campaign-info">
                    <div className="label">
                      {selectedCampaign?.unitForCalculate || EMPTY_STRING}
                    </div>
                    <div className="value">
                      {calculatedValue || EMPTY_STRING}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!preference?.isRevisionDownloaded && !isWorkflow && <DownloadBrowser />}

      <div className="setting">
        {/* <LanguageSwitch /> */}
        <ThemeSwitch />

        {!isWorkflow && <UserInfo />}
      </div>

      <ModalInstruction />
    </TopBarWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isSidebarOpen: state.Layout.isSidebarOpen,
    pageName: state?.Layout?.pageName,
    isFullScreen: state?.WorkflowRunner?.isFullScreen,
    preference: state?.Preference?.preference,
    selectedCampaign: state?.Campaign?.selectedCampaign,
    calculatedValue: state?.CampaignProfile?.calculatedValue,
  }),
  { actSetModalInstructionOpen },
)(TopBar);
