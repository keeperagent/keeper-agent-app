import { IIconProps } from "./index";

const PaperPlaneIcon = (props: IIconProps) => {
  const {
    color = "#6e6b7b",
    width = 24,
    height = 24,
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
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
};

export default PaperPlaneIcon;
