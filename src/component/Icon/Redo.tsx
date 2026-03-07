import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=redo&weight=solid&corner=rounded&type=uicon

const RedoIcon = (props: IIconProps) => {
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
      <path d="M17.244,4A2,2,0,0,0,13.83,5.414V7H9a9.01,9.01,0,0,0-9,9v7a1,1,0,0,0,2,0,6.006,6.006,0,0,1,6-6h5.83v1.586A2,2,0,0,0,17.244,20l5.879-5.879a3,3,0,0,0,0-4.242Z" />
    </svg>
  );
};

export default RedoIcon;
