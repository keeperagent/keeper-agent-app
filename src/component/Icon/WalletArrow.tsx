import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=wallet-income&weight=regular+thin&corner=rounded&type=uicon

const WalletArrowIcon = (props: IIconProps) => {
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
      <path d="M18.5,14.5c.828,0,1.5,.672,1.5,1.5s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5,.672-1.5,1.5-1.5Zm4.5-4.5c-.553,0-1,.448-1,1v10c0,.552-.448,1-1,1H5c-1.654,0-3-1.346-3-3V9s0-.004,0-.005c.854,.64,1.903,1.005,2.999,1.005H13c.553,0,1-.448,1-1s-.447-1-1-1H5c-.856,0-1.653-.381-2.217-1.004,.549-.607,1.335-.996,2.217-.996h7c.553,0,1-.448,1-1s-.447-1-1-1H5C2.224,3.994,.02,6.304,0,9v10c0,2.757,2.243,5,5,5H21c1.654,0,3-1.346,3-3V11c0-.552-.447-1-1-1Zm-5.503-.615c.815,.815,2.148,.822,2.964,.009l2.236-2.177c.396-.385,.404-1.018,.02-1.414-.387-.396-1.02-.405-1.414-.019l-1.303,1.268V1c0-.552-.447-1-1-1s-1,.448-1,1V7.07l-1.297-1.281c-.394-.388-1.025-.385-1.415,.009-.388,.393-.384,1.026,.009,1.414l2.2,2.173Z" />
    </svg>
  );
};

export default WalletArrowIcon;
