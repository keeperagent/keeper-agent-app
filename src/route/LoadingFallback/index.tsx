import { Container, LegoGrid, LegoBlock, LoadingText } from "./style";

const BLOCK_COLORS = [
  "#8b5cf6",
  "#7FC8A9",
  "#8b5cf6",
  "#7FC8A9",
  "#a78bfa",
  "#7FC8A9",
  "#8b5cf6",
  "#7FC8A9",
  "#8b5cf6",
];

const LoadingFallback = () => (
  <Container>
    <LegoGrid>
      {BLOCK_COLORS.map((color, i) => (
        <LegoBlock
          key={i}
          $color={color}
          $delay={`${i * 0.1}s`}
        />
      ))}
    </LegoGrid>

    <LoadingText>Getting ready</LoadingText>
  </Container>
);

export default LoadingFallback;
