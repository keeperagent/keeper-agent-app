import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=spacing-horizontal&weight=regular&corner=rounded&type=uicon

const VerticalIcon = (props: IIconProps) => {
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
      <path d="M21,24c-.55,0-1-.45-1-1V1c0-.55,.45-1,1-1s1,.45,1,1V23c0,.55-.45,1-1,1Zm-17-1V1c0-.55-.45-1-1-1s-1,.45-1,1V23c0,.55,.45,1,1,1s1-.45,1-1Zm13-7V8c0-2.21-1.79-4-4-4h-2c-2.21,0-4,1.79-4,4v8c0,2.21,1.79,4,4,4h2c2.21,0,4-1.79,4-4ZM13,6c1.1,0,2,.9,2,2v8c0,1.1-.9,2-2,2h-2c-1.1,0-2-.9-2-2V8c0-1.1,.9-2,2-2h2Z" />
    </svg>
  );
};

export default VerticalIcon;
