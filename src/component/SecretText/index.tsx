import { useState } from "react";
import { Tooltip, message } from "antd";
import copy from "copy-to-clipboard";
import {
  CopyIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  CheckIcon,
} from "@/component/Icon";
import { useTranslation } from "@/hook";
import SpoilerText from "@/component/SpoilerText";
import { SecretTextWrapper } from "./style";

type ISecretTextProps = {
  text: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

const SecretText = (props: ISecretTextProps) => {
  const { translate } = useTranslation();
  const { text, style, onClick } = props;
  const [isShowText, setShowText] = useState(false);
  const [isCopied, setCopied] = useState(false);

  const onCopy = () => {
    copy(text);
    message.success(translate("copied"));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const onToggleShowText = () => {
    setShowText(!isShowText);
  };

  const onClickText = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <SecretTextWrapper style={style}>
      <div className="text" onClick={onClickText}>
        {isShowText ? text : <SpoilerText text={text} />}
      </div>

      <Tooltip title={translate("copy")} placement="top">
        {isCopied ? (
          <div className="icon copied">
            <CheckIcon />
          </div>
        ) : (
          <div className="icon" onClick={onCopy}>
            <CopyIcon />
          </div>
        )}
      </Tooltip>

      <div className="icon" onClick={onToggleShowText}>
        {isShowText ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </div>
    </SecretTextWrapper>
  );
};

export default SecretText;
