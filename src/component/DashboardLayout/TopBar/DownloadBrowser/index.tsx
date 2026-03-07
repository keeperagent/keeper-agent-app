import { Alert } from "antd";
import HoverLink from "@/component/HoverLink";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

const DownloadBrowser = () => {
  const { translate } = useTranslation();

  return (
    <Wrapper>
      <Alert
        title={
          <HoverLink
            prefixString={translate("topbar.needToDownloadBrowser")}
            postString=""
            textLink={translate("here")}
            link="/dashboard/home?showTour=true"
          />
        }
        type="info"
        showIcon
        className="help"
      />
    </Wrapper>
  );
};

export default DownloadBrowser;
