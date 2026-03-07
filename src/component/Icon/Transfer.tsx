import { IIconProps } from "./index";

// https://www.flaticon.com/search?word=wallet-arrow&weight=regular&corner=rounded&type=uicon

const TransferIcon = (props: IIconProps) => {
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
      <path d="m20,16c0,.828-.672,1.5-1.5,1.5s-1.5-.672-1.5-1.5.672-1.5,1.5-1.5,1.5.672,1.5,1.5Zm3-8c-.553,0-1,.448-1,1v12c0,.551-.448,1-1,1H5c-1.654,0-3-1.346-3-3v-10s0-.004,0-.005c.854.64,1.903,1.005,2.999,1.005h10c.553,0,1-.448,1-1s-.447-1-1-1H5c-.856,0-1.653-.381-2.217-1.004.549-.607,1.335-.996,2.217-.996h7c.553,0,1-.448,1-1s-.447-1-1-1h-7c-3,0-5,2.5-5,5v10c0,2.757,2.243,5,5,5h16c1.654,0,3-1.346,3-3v-12c0-.552-.447-1-1-1Zm-6.297-3.789l1.297-1.281v6.07c0,.552.447,1,1,1s1-.448,1-1V2.948l1.303,1.268c.194.189.445.284.697.284.261,0,.521-.101.717-.302.385-.396.377-1.029-.02-1.414l-2.227-2.168c-.821-.819-2.152-.818-2.97-.004l-2.204,2.177c-.393.388-.396,1.021-.009,1.414.39.394,1.021.396,1.415.009Z" />
    </svg>
  );
};

export default TransferIcon;
