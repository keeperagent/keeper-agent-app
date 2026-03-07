import { TotalDataWrapper } from "./style";

type ITotalData = {
  text: string;
};

const TotalData = (props: ITotalData) => {
  const { text } = props;

  return <TotalDataWrapper>{text}</TotalDataWrapper>;
};

export default TotalData;
