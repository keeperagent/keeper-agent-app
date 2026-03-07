import { ShooptingStarBgWrapper } from "./style";

// reference: https://codepen.io/YusukeNakaya/pen/XyOaBj
interface ShooptingStarBgProps {
  shouldAnimate: boolean;
}

const ShooptingStarBg = (props: ShooptingStarBgProps) => {
  const { shouldAnimate } = props;

  const renderAnimateStar = () =>
    Array.from(Array(15).keys()).map((index: number) => (
      <div className="shooting-star animate" key={index} />
    ));

  const renderStar = () =>
    Array.from(Array(15).keys()).map((index: number) => (
      <div className="shooting-star" key={index} />
    ));

  return (
    <ShooptingStarBgWrapper>
      <div className="night">
        {renderStar()}

        {shouldAnimate ? renderAnimateStar() : null}
      </div>
    </ShooptingStarBgWrapper>
  );
};

export default ShooptingStarBg;
