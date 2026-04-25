import { useMemo, ReactNode, useEffect, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { connect } from "react-redux";
import { ThemeProvider } from "styled-components";
import { ThemeConfig, theme, ConfigProvider, App as AntApp } from "antd";
import { GlobalStyle } from "@/style/global";
import { lightTheme, darkTheme } from "@/style/theme";
import { OverideAntdStyle } from "@/style/overideAntd";
import { RootState } from "@/redux/store";
import { actSetIsFullscreen } from "@/redux/workflowRunner";
import { useCreateAppLog, useTranslation } from "@/hook";
import { AppLogType } from "@/electron/type";
import { formatTimeToDate } from "@/service/util";
import RequireAuth from "./RequireAuth";
import { routesConfig } from "./config";
import LoadingFallback from "./LoadingFallback";

const light: ThemeConfig = {
  token: { colorPrimary: "#4f46e5" },
  algorithm: theme.defaultAlgorithm,
};

const dark: ThemeConfig = {
  token: { colorPrimary: "#4f46e5" },
  algorithm: theme.darkAlgorithm,
};

export interface IRoute {
  isPrivateRoute: boolean;
  path: string;
  element: ReactNode;
  isFullScreen?: boolean | undefined;
}

let registerNetworkListener = false;
let translateFunc: any = null;

const AppRoute = (props: any) => {
  const { notification } = AntApp.useApp();
  const { isLightMode } = props;
  const { translate, locale } = useTranslation();
  const { createAppLog } = useCreateAppLog();

  useEffect(() => {
    props?.actSetIsFullscreen(false);

    if (!registerNetworkListener) {
      window?.addEventListener("offline", notifyOffline);
      window?.addEventListener("online", notifyOnline);
      registerNetworkListener = true;
    }
  }, []);

  useEffect(() => {
    translateFunc = translate;
  }, [translate]);

  const notifyOffline = () => {
    const message =
      translateFunc("offline") + `. ${formatTimeToDate(new Date().getTime())}`;
    notification.warning({
      title: translateFunc("notification"),
      description: message,
      duration: 5 * 60, // 5 minutes
    });
    createAppLog({
      logType: AppLogType.WORKFLOW,
      message,
    });
  };

  const notifyOnline = () => {
    const message =
      translate("online") + `. ${formatTimeToDate(new Date().getTime())}`;
    notification.success({
      title: translate("notification"),
      description: message,
      duration: 5 * 60, // 5 minutes
    });
    createAppLog({
      logType: AppLogType.WORKFLOW,
      message,
    });
  };

  const theme = useMemo(() => {
    return isLightMode ? light : dark;
  }, [isLightMode]);

  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <ThemeProvider theme={isLightMode ? lightTheme : darkTheme}>
          <OverideAntdStyle />
          <GlobalStyle locale={locale} />

          {/* Use HashRouter instead of BrowserRouter */}
          {/* https://github.com/electron-userland/electron-builder/issues/2662#issuecomment-439776545 */}
          <HashRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {routesConfig.map((routeInfo: IRoute, index: number) => {
                  if (routeInfo?.isPrivateRoute) {
                    return (
                      <Route
                        key={index}
                        path={routeInfo?.path}
                        element={
                          <RequireAuth isFullScreen={routeInfo?.isFullScreen}>
                            {routeInfo?.element}
                          </RequireAuth>
                        }
                      />
                    );
                  }

                  return <Route key={index} {...routeInfo} />;
                })}
              </Routes>
            </Suspense>
          </HashRouter>
        </ThemeProvider>
      </AntApp>
    </ConfigProvider>
  );
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  { actSetIsFullscreen },
)(AppRoute);
