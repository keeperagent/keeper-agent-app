import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=spacing-vertical&weight=regular&corner=rounded&type=uicon

const HorizontalIcon = (props: IIconProps) => {
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
      <path d="M23,4H1c-.55,0-1-.45-1-1s.45-1,1-1H23c.55,0,1,.45,1,1s-.45,1-1,1Zm1,17c0-.55-.45-1-1-1H1c-.55,0-1,.45-1,1s.45,1,1,1H23c.55,0,1-.45,1-1Zm-4-8v-2c0-2.21-1.79-4-4-4H8c-2.21,0-4,1.79-4,4v2c0,2.21,1.79,4,4,4h8c2.21,0,4-1.79,4-4Zm-4-4c1.1,0,2,.9,2,2v2c0,1.1-.9,2-2,2H8c-1.1,0-2-.9-2-2v-2c0-1.1,.9-2,2-2h8Z" />
    </svg>
  );
};

export default HorizontalIcon;
