import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=minus&weight=regular&corner=rounded&type=uicon

const MinusCircleIcon = (props: IIconProps) => {
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
      <path d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm0,22c-5.514,0-10-4.486-10-10S6.486,2,12,2s10,4.486,10,10-4.486,10-10,10Zm5-10c0,.552-.448,1-1,1h-8c-.552,0-1-.448-1-1s.448-1,1-1h8c.552,0,1,.448,1,1Z" />
    </svg>
  );
};

export default MinusCircleIcon;
