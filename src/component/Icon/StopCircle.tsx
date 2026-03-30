import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=stop%20circle&weight=regular&corner=rounded&type=uicon

const StopCircleIcon = (props: IIconProps) => {
  const {
    color = "#E72929",
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
      <rect x="7" y="7" width="10" height="10" rx="3" fill="white" />
      <path d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm5,14c0,1.654-1.346,3-3,3h-4c-1.654,0-3-1.346-3-3v-4c0-1.654,1.346-3,3-3h4c1.654,0,3,1.346,3,3v4Zm-2-4v4c0,.551-.449,1-1,1h-4c-.551,0-1-.449-1-1v-4c0-.551.449-1,1-1h4c.551,0,1,.449,1,1Z" />
    </svg>
  );
};

export default StopCircleIcon;
