import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=list&weight=regular&corner=rounded&type=uicon

const ListIcon = (props: IIconProps) => {
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
      <path d="M7,6H23a1,1,0,0,0,0-2H7A1,1,0,0,0,7,6Z" />
      <path d="M23,11H7a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z" />
      <path d="M23,18H7a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2Z" />
      <circle cx="2" cy="5" r="2" />
      <circle cx="2" cy="12" r="2" />
      <circle cx="2" cy="19" r="2" />
    </svg>
  );
};

export default ListIcon;
