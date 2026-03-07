import { useState } from "react";
import { message } from "antd";
import copy from "copy-to-clipboard";
import { CopyIcon, CheckIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

type IProps = {
  text: string;
  isWithCopy?: boolean;
  style?: React.CSSProperties;
};

const Code = (props: IProps) => {
  const { translate } = useTranslation();
  const { text, isWithCopy, style } = props;
  const [isCopied, setCopied] = useState(false);

  const onCopy = () => {
    copy(text);
    message.success(translate("copied"));
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <Wrapper style={style}>
      <div className="content" style={{ width: isWithCopy ? "95%" : "100%" }}>
        {text}
      </div>

      {isWithCopy && (
        <div className="icon">
          {isCopied ? (
            <div className="icon copied">
              <CheckIcon />
            </div>
          ) : (
            <div className="icon" onClick={onCopy}>
              <CopyIcon />
            </div>
          )}
        </div>
      )}
    </Wrapper>
  );
};

export default Code;
