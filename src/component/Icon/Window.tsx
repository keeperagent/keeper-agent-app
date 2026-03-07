import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=window&weight=regular+bold&type=uicon

const WindowIcon = (props: IIconProps) => {
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
      <path d="M19,1H5C2.24,1,0,3.24,0,6v12c0,2.76,2.24,5,5,5h14c2.76,0,5-2.24,5-5V6c0-2.76-2.24-5-5-5ZM5,3h14c1.65,0,3,1.35,3,3v2H2v-2c0-1.65,1.35-3,3-3Zm14,18H5c-1.65,0-3-1.35-3-3V10H22v8c0,1.65-1.35,3-3,3Zm-1-15.5c0-.83,.67-1.5,1.5-1.5s1.5,.67,1.5,1.5-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5Zm-4,0c0-.83,.67-1.5,1.5-1.5s1.5,.67,1.5,1.5-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5Zm-4,0c0-.83,.67-1.5,1.5-1.5s1.5,.67,1.5,1.5-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5Z" />
    </svg>
  );
};

export default WindowIcon;
