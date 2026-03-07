import { IIconProps } from "./index";

// https://www.flaticon.com/free-icon-font/angle-small-up_3916860?page=1&position=18&term=arrow&origin=search&related_id=3916860

const UpArrowIcon = (props: IIconProps) => {
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
      <path d="m18.5,15c-.122,0-.245-.045-.342-.135l-4.43-4.143c-.941-.939-2.527-.928-3.445-.012l-4.441,4.154c-.202.188-.519.178-.707-.023-.188-.202-.178-.519.023-.707l4.43-4.143c1.271-1.271,3.541-1.283,4.836.012l4.418,4.131c.201.188.212.505.023.707-.099.105-.231.158-.365.158Z" />
    </svg>
  );
};

export default UpArrowIcon;
