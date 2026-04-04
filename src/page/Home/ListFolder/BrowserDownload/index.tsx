import { useEffect, useState, useRef, Fragment } from "react";
import {
  Badge,
  Button,
  Collapse,
  Input,
  Progress,
  Tour,
  TourProps,
  message,
} from "antd";
import { connect } from "react-redux";
import qs from "qs";
import { useLocation } from "react-router-dom";
import { IPreference } from "@/electron/type";
import { RootState } from "@/redux/store";
import { useTranslation, useCheckDeviceType } from "@/hook";
import {
  useDownloadBrowser,
  useGetFolderStatistic,
  useUpdatePreference,
} from "@/hook";
import { IDownloadStatus } from "@/redux/browser";
import { Wrapper } from "./style";

type IProps = {
  downloadStatus: IDownloadStatus;
  preference: IPreference | null;
};

const BrowserDownload = (props: IProps) => {
  const { downloadStatus, preference } = props;
  const { translate } = useTranslation();

  const [isTourOpen, setTourOpen] = useState(false);
  const [customChromePath, setCustomChromePath] = useState("");
  const ref1 = useRef(null);

  const { loading, isExist, downloadBrowser } = useDownloadBrowser();
  const { getFolderStatistic: getBrowserFolderStatistic } =
    useGetFolderStatistic("browser");
  const { updatePreference } = useUpdatePreference();
  const { isWindow } = useCheckDeviceType();

  const location = useLocation();
  const { search } = location;
  const { showTour } = qs.parse(search, { ignoreQueryPrefix: true });

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
    if (downloadStatus?.isDone && downloadStatus?.isAvailable) {
      getBrowserFolderStatistic(2);
    }
  }, [downloadStatus]);

  const onDownload = () => {
    downloadBrowser();
  };

  const onCloseTour = () => {
    setTourOpen(false);
  };

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
      message.info(translate("home.notiUseChromium"));
    }
  };

  const isInstalled = isExist || downloadStatus?.isAvailable;

  const steps: TourProps["steps"] = [
    {
      title: translate("tour.clickToDownloadBrowser"),
      description: translate("tour.downloadBrowserDescription"),
      target: () => ref1.current,
      nextButtonProps: {
        children: translate("gotit"),
      },
    },
  ];

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
      <Fragment>
        {!isInstalled && (
          <div className="status-row">
            <div className="status-info">
              <Fragment>
                <Badge status="error" />
                <span>{translate("home.notDownloadedYet")}</span>
              </Fragment>
            </div>

            <Button
              size="small"
              type="primary"
              onClick={onDownload}
              ref={ref1}
              loading={loading}
            >
              {translate("browser.download")}
            </Button>
          </div>
        )}

        {downloadStatus?.isProcessing && (
          <Progress
            percent={Math.round(
              (downloadStatus?.downloadedBytes * 100) /
                downloadStatus?.totalBytes,
            )}
            strokeColor="var(--color-success)"
            strokeLinecap="butt"
            status="active"
            style={{ marginTop: "var(--margin-top)" }}
          />
        )}

        <Collapse
          bordered={false}
          ghost
          items={[
            {
              label: translate("browser.customChromePath"),
              children: renderCustomChromePath(),
            },
          ]}
          className="collapse"
        />
      </Fragment>

      <Tour
        open={isTourOpen}
        onClose={onCloseTour}
        steps={steps}
        type="primary"
      />
    </Wrapper>
  );
};

export default connect((state: RootState) => ({
  downloadStatus: state?.Browser?.downloadStatus,
  preference: state?.Preference?.preference,
}))(BrowserDownload);
