import { ReactElement } from "react";
import { Radio } from "antd";
import { TagOptionWrapper } from "./style";

interface TagOptionProps {
  content: string;
  checked?: boolean;
  onClick?: any;
  style?: React.CSSProperties;
  icon?: ReactElement;
}

const TagOption = (props: TagOptionProps) => {
  const { content, checked, onClick, style, icon: Icon } = props;

  return (
    <TagOptionWrapper
      onClick={onClick}
      // @ts-ignore
      checked={Boolean(checked)}
      style={style}
    >
      <div className="radio-wrapper">
        <Radio checked={checked} />
      </div>

      <div className="content">{content}</div>

      {Icon && <div className="icon">{Icon}</div>}
    </TagOptionWrapper>
  );
};

export default TagOption;
