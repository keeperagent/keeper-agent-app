import { useEffect, useState, useRef, Fragment, useMemo } from "react";
import {
  Badge,
  Button,
  Spin,
  Progress,
  Tour,
  TourProps,
  Collapse,
  Input,
  message,
  Tooltip,
} from "antd";
import { connect } from "react-redux";
import qs from "qs";
import { useLocation } from "react-router-dom";
import { useLazyQuery } from "@apollo/client/react";
import { IPreference } from "@/electron/type";
import { QueryGetConfiguration } from "@/api/configuration";
import { ReloadIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { useTranslation, useCheckDeviceType } from "@/hook";
import {
  useDownloadBrowser,
  useGetFolderStatistic,
  useUpdatePreference,
} from "@/hook";
import { actSaveConfiguration } from "@/redux/preference";
import { IDownloadStatus } from "@/redux/browser";
import { IConfiguration } from "@/types/interface";
import { Wrapper } from "./style";

type IProps = {
  downloadStatus: IDownloadStatus;
  preference: IPreference | null;
  configuration: IConfiguration;
  actSaveConfiguration: (payload: IConfiguration) => void;
};

const BrowserDownload = (props: IProps) => {
  const { downloadStatus, preference, configuration } = props;
  const { translate } = useTranslation();

  const [isTourOpen, setTourOpen] = useState(false);
  const [anyVersion, setAnyVersion] = useState("");
  const [customChromePath, setCustomChromePath] = useState("");
  const [isDownloadLatest, setIsDownloadLatest] = useState(false);
  const ref1 = useRef(null);

  const { loading, isExist, downloadBrowser } = useDownloadBrowser();
  const { getFolderStatistic: getBrowserFolderStatistic } =
    useGetFolderStatistic("browser");
  const { updatePreference } = useUpdatePreference();
  const {
    checkDeviceType,
    loading: checkDeviceLoading,
    isSuccess,
    isMacOSIntel,
    isMacOSArm,
    isWindow,
  } = useCheckDeviceType();

  const location = useLocation();
  const { search } = location;
  const { showTour } = qs.parse(search, { ignoreQueryPrefix: true });

  const [actGetConfiguration, getConfigurationResponse] = useLazyQuery(
    QueryGetConfiguration,
    {
      fetchPolicy: "no-cache",
    },
  );

  useEffect(() => {
    checkDeviceType();
  }, []);

  useEffect(() => {
    if (!preference?.browserRevision) {
      actGetConfiguration();
    }
  }, [preference?.browserRevision]);

  useEffect(() => {
    setCustomChromePath(preference?.customChromePath || "");
  }, [preference]);

  useEffect(() => {
    if (showTour) {
      setTimeout(() => {
        setTourOpen(true);
      }, 500);
    }
  }, [showTour]);

  useEffect(() => {
    const { data, loading, called, error } = getConfigurationResponse;
    const resData = (data as any)?.getPublicConfiguration as any;

    if (called && !loading) {
      if (resData?.data) {
        props.actSaveConfiguration(resData?.data);
      }
    }

    if (error) {
      console.error(error.message);
    }
  }, [getConfigurationResponse.loading]);

  const defaultBrowserVersion = useMemo(() => {
    if (!checkDeviceLoading && isSuccess) {
      if (isMacOSIntel) {
        return configuration?.defaultBrowserVersionMacOSIntel;
      }

      if (isMacOSArm) {
        return configuration?.defaultBrowserVersionMacOSArm;
      }

      if (isWindow) {
        return configuration?.defaultBrowserVersionWindow;
      }
    }

    return "";
  }, [
    configuration,
    checkDeviceLoading,
    isMacOSArm,
    isMacOSIntel,
    isWindow,
    isSuccess,
  ]);

  useEffect(() => {
    if (isExist && isDownloadLatest && downloadStatus?.isDone) {
      updatePreference({
        id: preference?.id,
        browserRevision: defaultBrowserVersion,
      });
      return;
    }

    if (isExist && anyVersion && downloadStatus?.isDone) {
      updatePreference({
        id: preference?.id,
        browserRevision: anyVersion,
      });
      return;
    }

    if (downloadStatus?.isDone && downloadStatus?.isAvailable) {
      getBrowserFolderStatistic(2);

      if (isDownloadLatest) {
        updatePreference({
          id: preference?.id,
          browserRevision: defaultBrowserVersion,
        });
      } else if (anyVersion) {
        updatePreference({
          id: preference?.id,
          browserRevision: anyVersion,
        });
      }
    }
  }, [
    downloadStatus,
    preference,
    anyVersion,
    defaultBrowserVersion,
    isDownloadLatest,
    isExist,
  ]);

  const onDownloadLastestVersion = () => {
    if (!defaultBrowserVersion) {
      message.error(translate("home.missingDefaultBrowserVersion"));
      return;
    }

    downloadBrowser(defaultBrowserVersion);
    setIsDownloadLatest(true);
  };

  const onDownloadAnyVersion = () => {
    downloadBrowser(anyVersion);
    setIsDownloadLatest(false);
  };

  const onCloseTour = () => {
    setTourOpen(false);
  };

  const steps: TourProps["steps"] = [
    {
      title: translate("tour.clickToDownloadBrowser"),
      description: translate("tour.downloadBrowserDescription"),
      target: () => ref1.current,
      nextButtonProps: { children: translate("gotit") },
    },
  ];

  const onChangeVersion = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnyVersion(event?.target?.value);
  };

  const renderDownloadAnyChrome = () => (
    <div className="advanced">
      <Input
        size="middle"
        placeholder={translate("home.enterVersion")}
        className="custom-input"
        style={{ width: "15rem" }}
        value={anyVersion}
        onChange={onChangeVersion}
      />

      <Button
        size="middle"
        style={{ marginLeft: "1rem" }}
        type="primary"
        onClick={onDownloadAnyVersion}
      >
        Download
      </Button>
    </div>
  );

  const onChangeCustomChromePath = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCustomChromePath(event?.target?.value);
  };

  const onUpdateCustomChromePath = async () => {
    await updatePreference({
      id: preference?.id,
      customChromePath,
    });

    if (customChromePath) {
      message.success(translate("home.notiUseCustomChromePath"));
    } else {
      message?.info(translate("home.notiUseChromium"));
    }
  };

  const renderCustomChromePath = () => (
    <div className="advanced">
      <Input
        size="middle"
        placeholder={
          isWindow
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        }
        className="custom-input"
        value={customChromePath}
        onChange={onChangeCustomChromePath}
      />

      <Button
        size="middle"
        style={{ marginLeft: "1rem" }}
        type="primary"
        onClick={onUpdateCustomChromePath}
      >
        {translate("save")}
      </Button>
    </div>
  );

  return (
    <Wrapper>
      <div className="title">{translate("home.chromeVersion")}</div>

      <Spin spinning={loading}>
        <Fragment>
          <div className="list-version">
            <div className="version">
              <div className="label">{translate("home.latestVersion")}</div>

              <div className="value">
                <span>{defaultBrowserVersion}</span>

                <Button
                  size="small"
                  style={{ marginLeft: "1rem" }}
                  type="primary"
                  onClick={onDownloadLastestVersion}
                  ref={ref1}
                >
                  Download
                </Button>

                <Tooltip title="Refresh">
                  <div
                    className="refresh"
                    onClick={() => {
                      actGetConfiguration();
                    }}
                  >
                    <ReloadIcon />
                  </div>
                </Tooltip>
              </div>
            </div>

            <div className="version">
              <div className="label">{translate("home.currentVersion")}</div>

              <div className="value">
                <Badge
                  status={
                    defaultBrowserVersion === preference?.browserRevision &&
                    preference?.isRevisionDownloaded
                      ? "success"
                      : "error"
                  }
                  style={{ marginRight: "1rem" }}
                />

                {preference?.browserRevision ||
                  translate("home.notDownloadedYet")}
              </div>
            </div>
          </div>

          <Collapse
            bordered={false}
            ghost
            items={[
              {
                label: translate("home.downloadAnyVersion"),
                children: renderDownloadAnyChrome(),
              },
              {
                label: "Custom Chrome path",
                children: renderCustomChromePath(),
              },
            ]}
            className="collapse"
          />
        </Fragment>
      </Spin>

      {downloadStatus?.isProcessing && (
        <Progress
          percent={Math.round(
            (downloadStatus?.downloadedBytes * 100) /
              downloadStatus?.totalBytes,
          )}
          strokeColor="var(--color-success)"
          trailColor="var(--background-success)"
          strokeLinecap="butt"
          status="active"
        />
      )}

      <Tour
        open={isTourOpen}
        onClose={onCloseTour}
        steps={steps}
        type="primary"
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    downloadStatus: state?.Browser?.downloadStatus,
    preference: state?.Preference?.preference,
    configuration: state?.Preference?.configuration,
  }),
  { actSaveConfiguration },
)(BrowserDownload);
