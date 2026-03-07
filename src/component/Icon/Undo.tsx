import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=undo&weight=solid&corner=rounded&type=uicon

const UndoIcon = (props: IIconProps) => {
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
      <path d="M15,7H10.17V5.414A2,2,0,0,0,6.756,4L.876,9.879a3,3,0,0,0,0,4.242L6.756,20a2,2,0,0,0,3.414-1.414V17H16a6.006,6.006,0,0,1,6,6,1,1,0,0,0,2,0V16A9.01,9.01,0,0,0,15,7Z" />
    </svg>
  );
};

export default UndoIcon;
