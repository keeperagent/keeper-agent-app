import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=book&weight=solid&corner=rounded&type=uicon

const BookBoldIcon = (props: IIconProps) => {
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
      <path d="m22.2 2.163a5 5 0 0 0 -4.157-1.069l-1.764.432a4 4 0 0 0 -3.279 3.935v15.467a6.909 6.909 0 0 1 -2 0v-15.467a3.981 3.981 0 0 0 -3.226-3.923l-1.874-.456a5 5 0 0 0 -5.9 4.918v10.793a5 5 0 0 0 4.105 4.919l6.286 1.143a9 9 0 0 0 3.218 0l6.291-1.143a5 5 0 0 0 4.1-4.919v-10.793a4.983 4.983 0 0 0 -1.8-3.837z" />
    </svg>
  );
};

export default BookBoldIcon;
