import { BlockPicker } from "react-color";
import { Popover } from "antd";
import { DEFAULT_COLOR_PICKER } from "@/config/constant";
import { Wrapper } from "./style";

type IProps = {
  color?: string;
  setColor?: (value: any) => void;
};

const ColorPicker = (props: IProps) => {
  const { color, setColor } = props;

  const handleChangeComplete = (color: any) => {
    setColor && setColor(color?.hex);
  };

  const onChange = (color: any) => {
    setColor && setColor(color?.hex);
  };

  return (
    <Wrapper>
      <Popover
        content={
          <BlockPicker
            onChangeComplete={handleChangeComplete}
            onChange={onChange}
            color={color}
            colors={[
              "#9AD0C2",
              "#26e823",
              "#898121",
              "#FFB7B7",
              "#A77979",
              "#ec3030",
              "#C683D7",
              "#7752FE",
              "#F5F0BB",
              "#FFD93D",
              "#FF8400",
              "#AED2FF",
              "#3B9AE1",
              "#B9B4C7",
              "#000000",
            ]}
            triangle="hide"
          />
        }
      >
        <div
          className="bg"
          style={{ backgroundColor: color || DEFAULT_COLOR_PICKER }}
        />
      </Popover>
    </Wrapper>
  );
};

export default ColorPicker;
