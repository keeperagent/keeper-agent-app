import { useState, useEffect, useRef } from "react";
import { Tooltip } from "antd";
import { formatTime } from "@/service/util";
import { ReloadIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

type IProps = {
  timestamp: number;
  onRefresh?: () => void;
};

const DataUpdateAt = (props: IProps) => {
  const { translate, locale } = useTranslation();
  const { timestamp, onRefresh } = props;
  const [timeAgo, setTimeAgo] = useState("");
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    setTimeAgo(formatTime(timestamp, locale));
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimeAgo(formatTime(timestamp, locale));
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
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
