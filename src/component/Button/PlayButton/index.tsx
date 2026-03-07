import { Spin } from "antd";
import { useMemo } from "react";
import { PlayButtonWrapper } from "./style";

interface PlayButtonProps {
  onStart?: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
}

const PlayButton = (props: PlayButtonProps) => {
  const { onStart, onStop, style, isRunning, loading } = props;

  const className = useMemo(() => {
    return isRunning ? "playing" : "paused";
  }, [isRunning]);

  const switchModePausePlay = () => {
    if (isRunning) {
      onStop && onStop();
    } else {
      onStart && onStart();
    }
  };

  return (
    <Spin spinning={Boolean(loading)} size="small">
      <PlayButtonWrapper style={style}>
        <button
          className={`${className} play-pause-button `}
          onClick={switchModePausePlay}
        >
          <i>P</i>
          <i>l</i>
          <i>a</i>
          <i>y</i>
          <i>Stop</i>
        </button>
      </PlayButtonWrapper>
    </Spin>
  );
};

export default PlayButton;
