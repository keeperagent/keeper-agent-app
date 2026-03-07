import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=rectangles-mixed&weight=regular&corner=rounded&type=uicon

const LayoutLeftIcon = (props: IIconProps) => {
  const {
    color = "#6e6b7b",
    width = 512,
    height = 512,
    className = "",
  } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
      className={className}
      fill={color}
    >
      <path d="m11,1h-6.5C2.019,1,0,3.019,0,5.5v3.5c0,1.103.897,2,2,2h9c1.103,0,2-.897,2-2V3c0-1.103-.897-2-2-2ZM2,9v-3.5c0-1.379,1.122-2.5,2.5-2.5h6.5v6s-9,0-9,0ZM19.5,3h-2.5c-1.103,0-2,.897-2,2v13c0,1.103.897,2,2,2h2.5c2.481,0,4.5-2.019,4.5-4.5V7.5c0-2.481-2.019-4.5-4.5-4.5Zm2.5,12.5c0,1.379-1.122,2.5-2.5,2.5h-2.5V5h2.5c1.378,0,2.5,1.121,2.5,2.5v8Zm-11-2.5h-7c-1.103,0-2,.897-2,2v3.5c0,2.481,2.019,4.5,4.5,4.5h4.5c1.103,0,2-.897,2-2v-6c0-1.103-.897-2-2-2Zm0,8h-4.5c-1.378,0-2.5-1.121-2.5-2.5v-3.5s7,0,7,0v6Z" />
    </svg>
  );
};

export default LayoutLeftIcon;
