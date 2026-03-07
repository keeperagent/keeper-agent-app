import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import spoilerBlackImg from "@/asset/spoiler.png";
import spoilerWhiteImg from "@/asset/spoiler-white.png";
import { SpoilerTextWrapper } from "./style";

type ISpoilerTextProps = {
  text: string;
  isLightMode: boolean;
};

const SpoilerText = (props: ISpoilerTextProps) => {
  const { text, isLightMode } = props;
  const listWord = text?.split(" ");

  return (
    <SpoilerTextWrapper>
      {listWord?.map((word: string, index: number) => (
        <span
          className="spoiler"
          key={index}
          style={{
            backgroundImage: `url(${
              isLightMode ? spoilerBlackImg : spoilerWhiteImg
            })`,
          }}
        >
          <span className="content">{word}</span>
        </span>
      ))}
    </SpoilerTextWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  {}
)(SpoilerText);
