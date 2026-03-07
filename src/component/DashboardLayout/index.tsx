import { useEffect, ReactNode, useMemo, useCallback } from "react";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useLazyQuery } from "@apollo/client/react";
import dayjs from "dayjs";
import qs from "qs";
import { RootState } from "@/redux/store";
import { QueryGetUseInfo } from "@/api/auth";
import {
  actSaveUpdateUserInfo,
  actSetErrorTime,
  actSetLastVerifyTime,
  actSetErrorCount,
} from "@/redux/auth";
import { useGetPreference } from "@/hook";
import { sleep } from "@/service/util";
import { IUser } from "@/types/interface";
import { MESSAGE } from "@/electron/constant";
import LogViewer from "@/component/LogViewer";
import Sidebar from "./SideBar";
import TopBar from "./TopBar";
import ModalGlobalSearch from "./ModalGlobalSearch";
import { LayoutWrapper, ContentWrapper, MainSectionWrapper } from "./style";

const thresholdDuration = 1 * 60 * 60 * 1000; // 1 hour
const thresholdDurationWhenError = 5 * 60 * 1000; // 5 minutes
const maxErrorCount = 5;
let isFreeTier: boolean | null = null;

interface IProps {
  children: ReactNode;
  isSidebarOpen: boolean;
  isFullScreen: boolean;
  lastVerifyTime: number;
  errorTime: number;
  errorCount: number;
  actSaveUpdateUserInfo: (payload: { [key: string]: any } | null) => void;
  actSetErrorTime: (payload: number) => void;
  actSetLastVerifyTime: (payload: number) => void;
  actSetErrorCount: (payload: number) => void;
  user: IUser | null;
}

const DashboardLayout = (props: IProps) => {
  const {
    children,
    isSidebarOpen,
    isFullScreen,
    lastVerifyTime,
    errorTime,
    errorCount,
    user,
  } = props;
  const { pathname, search } = useLocation();
  const { workflowId } = qs.parse(search, { ignoreQueryPrefix: true });
  const { getPreference } = useGetPreference();
  const navigate = useNavigate();

  const [actGetUserInfo, getGetUserInfoResponse] = useLazyQuery(
    QueryGetUseInfo,
    {
      fetchPolicy: "network-only",
    },
  );

  useEffect(() => {
    getPreference();
  }, []);

  useEffect(() => {
    isFreeTier =
      !user?.tierStatus ||
      !user?.tierStatus?.pricingTier ||
      user?.tierStatus?.pricingTier?.price === 0;
    const expiredAt = user?.tierStatus?.expiredAt || 0;
    const isExpired =
      expiredAt > 0 && dayjs().isAfter(dayjs(Number(expiredAt)));
    if (isExpired) {
      isFreeTier = false;
    }
  }, [user]);

  const sendUserPermissions = useCallback(async (requestId: string) => {
    while (isFreeTier === null) {
      await sleep(500);
    }
    window?.electron?.send(MESSAGE.GET_USER_PERMISSIONS_RES, {
      requestId,
      data: isFreeTier,
    });
  }, []);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      sendUserPermissions(payload?.requestId);
    };
    window?.electron?.on(MESSAGE.GET_USER_PERMISSIONS, handler);

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.GET_USER_PERMISSIONS);
    };
  }, [sendUserPermissions]);

  useEffect(() => {
    const currentTime = new Date().getTime();
    if (errorCount === 0) {
      if (
        lastVerifyTime === 0 ||
        currentTime - lastVerifyTime > thresholdDuration
      ) {
        actGetUserInfo();
      }
    } else if (currentTime - errorTime > thresholdDurationWhenError) {
      actGetUserInfo();
    }
  }, [pathname, lastVerifyTime, errorCount, errorTime]);

  useEffect(() => {
    const { data, loading, called } = getGetUserInfoResponse;
    const resData = (data as any)?.getUserInfo as any;

    if (!called || loading) {
      return;
    }

    if (resData?.data) {
      props?.actSaveUpdateUserInfo(resData?.data);
      props?.actSetLastVerifyTime(new Date().getTime());
      props?.actSetErrorCount(0);
      return;
    }

    // Query finished but no data — either a network error or server rejected the token
    if (errorCount >= maxErrorCount) {
      navigate("/logout");
      return;
    }
    props?.actSetErrorCount(errorCount + 1);
    props?.actSetErrorTime(new Date().getTime());
  }, [getGetUserInfoResponse.loading]);

  const isAgentView = useMemo(() => {
    return pathname?.includes("/dashboard/ask-agent");
  }, [pathname]);

  return (
    <LayoutWrapper id="dashboard">
      {!isFullScreen && <Sidebar />}

      <MainSectionWrapper
        isSidebarOpen={isSidebarOpen}
        className={isFullScreen ? "fullscreen" : ""}
      >
        <TopBar />
        <ModalGlobalSearch />
        <ContentWrapper
          className={
            (pathname?.includes("/dashboard/workflow") ||
              pathname?.includes("/dashboard/campaign")) &&
            workflowId !== undefined
              ? "no-padding"
              : ""
          }
        >
          {children}
        </ContentWrapper>
      </MainSectionWrapper>

      {!isAgentView && <LogViewer />}
    </LayoutWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isSidebarOpen: state.Layout.isSidebarOpen,
    user: state?.Auth?.user,
    isFullScreen: state?.WorkflowRunner?.isFullScreen,
    lastVerifyTime: state?.Auth?.lastVerifyTime,
    errorTime: state?.Auth?.errorTime,
    errorCount: state?.Auth?.errorCount,
    flowData: state?.WorkflowRunner?.flowData,
    isSaved: state?.WorkflowRunner?.isSaved,
  }),
  {
    actSaveUpdateUserInfo,
    actSetErrorTime,
    actSetLastVerifyTime,
    actSetErrorCount,
  },
)(DashboardLayout);
