import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=chart-mix&weight=regular&corner=rounded&type=uicon

const ChartIcon = (props: IIconProps) => {
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
      <path d="M5,8.99c-.88,0-1.76-.33-2.42-1L.29,5.71c-.39-.39-.39-1.02,0-1.41s1.02-.39,1.41,0l2.28,2.28c.56,.56,1.46,.56,2.02,0l3.56-3.56c1.34-1.34,3.51-1.34,4.85,0l1.56,1.56c.54,.54,1.48,.54,2.02,0L22.29,.29c.39-.39,1.02-.39,1.41,0s.39,1.02,0,1.41l-4.28,4.28c-1.29,1.29-3.55,1.29-4.85,0l-1.56-1.56c-.56-.56-1.46-.56-2.02,0l-3.56,3.56c-.67,.67-1.55,1-2.42,1Zm3,14.01V14c0-.55-.45-1-1-1s-1,.45-1,1v9c0,.55,.45,1,1,1s1-.45,1-1Zm-5,0V12c0-.55-.45-1-1-1s-1,.45-1,1v11c0,.55,.45,1,1,1s1-.45,1-1Zm10,0V9c0-.55-.45-1-1-1s-1,.45-1,1v14c0,.55,.45,1,1,1s1-.45,1-1Zm5,0V12c0-.55-.45-1-1-1s-1,.45-1,1v11c0,.55,.45,1,1,1s1-.45,1-1Zm5,0V8c0-.55-.45-1-1-1s-1,.45-1,1v15c0,.55,.45,1,1,1s1-.45,1-1Z" />
    </svg>
  );
};

export default ChartIcon;
