import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=stop&type=uicon

const StopIcon = (props: IIconProps) => {
  const {
    color = "#6e6b7b",
    width = 512,
    height = 512,
    className = "",
    onClick,
  } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
      className={className}
      fill={color}
      onClick={onClick}
    >
      <rect width="24" height="24" />
    </svg>
  );
};

export default StopIcon;
