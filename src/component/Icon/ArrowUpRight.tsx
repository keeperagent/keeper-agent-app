import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=up-right-from-square&weight=regular&corner=rounded&type=uicon

const ArrowUpRightIcon = (props: IIconProps) => {
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
      <path d="m24,3v7c0,.552-.447,1-1,1s-1-.448-1-1V3.414l-11.793,11.793c-.195.195-.451.293-.707.293s-.512-.098-.707-.293c-.391-.391-.391-1.023,0-1.414L20.586,2h-6.586c-.553,0-1-.448-1-1s.447-1,1-1h7c1.654,0,3,1.346,3,3Zm-1,11c-.553,0-1,.448-1,1v4c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V5c0-1.654,1.346-3,3-3h4c.553,0,1-.448,1-1s-.447-1-1-1h-4C2.243,0,0,2.243,0,5v14c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5v-4c0-.552-.447-1-1-1Z" />
    </svg>
  );
};

export default ArrowUpRightIcon;
