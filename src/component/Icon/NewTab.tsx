import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=arrow%20up%20right%20square&weight=regular&corner=rounded&type=uicon

const NewTabIcon = (props: IIconProps) => {
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
      <path d="m24,2.5v7c0,.829-.672,1.5-1.5,1.5s-1.5-.671-1.5-1.5v-4.379l-11.439,11.439c-.293.293-.677.439-1.061.439s-.768-.146-1.061-.439c-.586-.585-.586-1.536,0-2.121L18.879,3h-4.379c-.828,0-1.5-.671-1.5-1.5s.672-1.5,1.5-1.5h7c1.379,0,2.5,1.122,2.5,2.5Zm-1.5,10.5c-.828,0-1.5.671-1.5,1.5v4c0,1.378-1.121,2.5-2.5,2.5H5.5c-1.379,0-2.5-1.122-2.5-2.5V5.5c0-1.378,1.121-2.5,2.5-2.5h4c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5h-4C2.468,0,0,2.467,0,5.5v13c0,3.033,2.468,5.5,5.5,5.5h13c3.032,0,5.5-2.467,5.5-5.5v-4c0-.829-.672-1.5-1.5-1.5Z" />
    </svg>
  );
};

export default NewTabIcon;
