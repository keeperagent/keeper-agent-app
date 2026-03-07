import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=warning&weight=solid&corner=rounded&type=uicon

const WarningIcon = (props: IIconProps) => {
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
      <path d="M23.08,15.33L15,2.57c-.68-.98-1.81-1.57-3-1.57s-2.32,.58-3.03,1.6L.93,15.31c-1.02,1.46-1.21,3.21-.5,4.56,.7,1.35,2.17,2.12,4.01,2.12h15.12c1.85,0,3.31-.77,4.01-2.12,.7-1.35,.51-3.09-.49-4.54ZM11,7c0-.55,.45-1,1-1s1,.45,1,1v6c0,.55-.45,1-1,1s-1-.45-1-1V7Zm1,12c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5,1.5,.67,1.5,1.5-.67,1.5-1.5,1.5Z" />
    </svg>
  );
};

export default WarningIcon;
