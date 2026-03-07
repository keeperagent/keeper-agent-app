import { Fragment, ReactNode, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "@/redux/store";
import { LAST_ROUTE_BEFORE_LOCK_KEY } from "@/config/constant";
import DashboardLayout from "@/component/DashboardLayout";
import LoadingFallback from "./LoadingFallback";

interface RequireAuthProps {
  children: ReactNode;
  isFullScreen?: boolean | undefined;
  isMasterKeyUnlocked?: boolean;
}

const RequireAuth = (props: RequireAuthProps) => {
  const { isFullScreen, isMasterKeyUnlocked } = props;
  const token = useSelector((state: RootState) => state?.Auth?.token);
  const isAuthPending = useSelector(
    (state: RootState) => state?.Auth?.isAuthPending,
  );
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait until main process has replied with auth state before redirecting
    if (isAuthPending) {
      return;
    }

    if (!token) {
      navigate("/logout");
    } else if (!isMasterKeyUnlocked) {
      const fullPath = location.pathname + location.search + location.hash;
      sessionStorage.setItem(LAST_ROUTE_BEFORE_LOCK_KEY, fullPath);
      navigate("/master-password");
    }
  }, [token, isMasterKeyUnlocked, isAuthPending]);

  // Show loading while main process hasn't confirmed auth state yet
  if (isAuthPending) {
    return <LoadingFallback />;
  }

  // Don't render children until auth is confirmed - prevents page flash
  if (!token || !isMasterKeyUnlocked) {
    return <LoadingFallback />;
  }

  return isFullScreen ? (
    <Fragment>{props?.children}</Fragment>
  ) : (
    <Fragment>
      <DashboardLayout>{props?.children}</DashboardLayout>
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    isMasterKeyUnlocked: state?.Session?.isMasterKeyUnlocked,
  }),
  {},
)(RequireAuth);
