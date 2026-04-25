import { Tooltip } from "antd";
import ellipsize from "ellipsize";
import { trimText } from "@/service/util";
import { Wrapper } from "./style";

interface IProps {
  text: string;
  maxLength: number;
}

const TrimText = (props: IProps) => {
  const { text, maxLength } = props;

  const shouldTruncateMiddle = text?.startsWith("0x");

  return text?.length > maxLength ? (
    <Tooltip title={text} placement="top">
      <Wrapper>
        {shouldTruncateMiddle
          ? ellipsize(text, maxLength, { truncate: "middle" as any })
          : trimText(text, maxLength)}
      </Wrapper>
    </Tooltip>
  ) : (
    <span>{text}</span>
  );
};

export default TrimText;
