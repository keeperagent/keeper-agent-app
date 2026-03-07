import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=cookie&weight=regular&corner=rounded&type=uicon

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
      <circle cx="9.5" cy="9.5" r="1.5" />
      <circle cx="18.5" cy="1.5" r="1.5" />
      <circle cx="21.5" cy="6.5" r="1.5" />
      <circle cx="9.5" cy="14.5" r="1.5" />
      <circle cx="14.5" cy="14.5" r="1.5" />
      <path d="M23.943,10.854a1,1,0,0,0-.9-.9A10,10,0,0,1,14.048.958a1,1,0,0,0-.9-.9C12.769.021,12.387,0,12,0A12,12,0,1,0,24,12C24,11.613,23.979,11.231,23.943,10.854ZM12,22A10,10,0,0,1,12,2l.17,0A12.006,12.006,0,0,0,22,11.83c0,.057,0,.113,0,.17A10.011,10.011,0,0,1,12,22Z" />
    </svg>
  );
};

export default CompressIcon;
