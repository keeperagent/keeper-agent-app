import { IIconProps } from "./index";

// https://www.flaticon.com/free-icon-font/angle-small-down_3916864?page=1&position=3&term=arrow&origin=search&related_id=3916864

const DownArrowIcon = (props: IIconProps) => {
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
      <path d="m12,15c-.916,0-1.776-.356-2.424-1.004l-4.418-4.131c-.201-.188-.212-.505-.023-.707.188-.201.505-.212.707-.023l4.43,4.143c.941.939,2.527.928,3.445.012l4.441-4.154c.202-.188.519-.178.707.023.188.202.178.519-.023.707l-4.43,4.143c-.636.636-1.496.992-2.412.992Z" />
    </svg>
  );
};

export default DownArrowIcon;
