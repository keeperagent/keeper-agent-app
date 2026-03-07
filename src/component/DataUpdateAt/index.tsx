import { useState, useEffect } from "react";
import { Tooltip } from "antd";
import { formatTime } from "@/service/util";
import { ReloadIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

type IProps = {
  timestamp: number;
  onRefresh?: () => void;
};

let interval: any = null;

const DataUpdateAt = (props: IProps) => {
  const { translate, locale } = useTranslation();
  const { timestamp, onRefresh } = props;
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    setTimeAgo(formatTime(timestamp, locale));
    if (interval) {
      clearInterval(interval);
    }

    interval = setInterval(() => {
      setTimeAgo(formatTime(timestamp, locale));
    }, 5000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timestamp]);

  return (
    <Wrapper>
      <Tooltip title="Refresh">
        <div className="icon" onClick={onRefresh}>
          <ReloadIcon />
        </div>
      </Tooltip>

      <div className="text">
        {translate("update")} {timeAgo}
      </div>
    </Wrapper>
  );
};

export default DataUpdateAt;
