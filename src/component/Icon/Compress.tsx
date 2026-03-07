import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=compress&weight=regular&corner=rounded&type=uicon

const CompressIcon = (props: IIconProps) => {
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
      <path d="M9,2.5A6.5,6.5,0,0,1,2.5,9h-1a1.5,1.5,0,0,1,0-3h1A3.5,3.5,0,0,0,6,2.5v-1a1.5,1.5,0,0,1,3,0Z" />
      <path d="M16.5,24A1.5,1.5,0,0,1,15,22.5v-1A6.5,6.5,0,0,1,21.5,15h1a1.5,1.5,0,0,1,0,3h-1A3.5,3.5,0,0,0,18,21.5v1A1.5,1.5,0,0,1,16.5,24Z" />
      <path d="M22.5,9h-1A6.5,6.5,0,0,1,15,2.5v-1a1.5,1.5,0,0,1,3,0v1A3.5,3.5,0,0,0,21.5,6h1a1.5,1.5,0,0,1,0,3Z" />
      <path d="M7.5,24A1.5,1.5,0,0,1,6,22.5v-1A3.5,3.5,0,0,0,2.5,18h-1a1.5,1.5,0,0,1,0-3h1A6.5,6.5,0,0,1,9,21.5v1A1.5,1.5,0,0,1,7.5,24Z" />
    </svg>
  );
};

export default CompressIcon;
