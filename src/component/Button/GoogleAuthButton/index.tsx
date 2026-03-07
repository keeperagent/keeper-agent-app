import gmailImg from "@/asset/gmail.png";
import { Wrapper } from "./style";

type IProps = {
  text?: string;
  onClick?: () => void;
};

const GoogleAuthButton = (props: IProps) => {
  const { text, onClick } = props;

  return (
    <Wrapper onClick={onClick}>
      <img src={gmailImg} alt="" />
      <div className="text">{text}</div>
    </Wrapper>
  );
};

export default GoogleAuthButton;
