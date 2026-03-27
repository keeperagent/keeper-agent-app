import { Wrapper } from "./style";

type Props = {
  text: string;
};

const RealtimeIndicator = ({ text }: Props) => {
  return (
    <Wrapper>
      <span className="dot" />
      <span className="text">{text}</span>
    </Wrapper>
  );
};

export default RealtimeIndicator;
