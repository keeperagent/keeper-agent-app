import styled, { css } from "styled-components";

const shootingTime = "5000ms";

const createCSS = () => {
  let styles = "";

  for (let i = 0; i < 20; i += 1) {
    const delay = `${Math.round(Math.random() * 9999)}ms`;
    const randTop = `${Math.round(Math.random() * 700 - 200)}px`;
    const randLeft = `${Math.round(Math.random() * 500)}px`;

    styles += `
        &:nth-child(${i}) {
          top: calc(50% - ${randTop});
          left: calc(50% - ${randLeft});
          animation-delay: ${delay};
        
          &::before,
          &::after {
            animation-delay: ${delay};
          }
        }
     `;
  }

  return css`
    ${styles}
  `;
};

const ShooptingStarBgWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 0;

  .night {
    width: 100%;
    height: 100%;
    transform: rotateZ(45deg);
    z-index: 0;
    margin-left: -35vw;
    margin-top: 0rem;

    .shooting-star {
      position: absolute;
      left: 50%;
      top: 50%;
      height: 1px;
      background: linear-gradient(
        -45deg,
        rgba(95, 145, 255, 1),
        rgba(0, 0, 255, 0)
      );
      border-radius: 999px;
      filter: drop-shadow(0 0 6px rgba(105, 155, 255, 1));

      &.animate {
        animation: tail ${shootingTime} ease-in-out infinite,
          shooting ${shootingTime} ease-in-out infinite;
      }

      ${createCSS()}

      &::before {
        content: "";
        position: absolute;
        top: calc(50% - 1px);
        right: 0;
        height: 1px;
        background: linear-gradient(
          -45deg,
          rgba(0, 0, 255, 0),
          rgba(95, 145, 255, 1),
          rgba(0, 0, 255, 0)
        );
        transform: translateX(50%) rotateZ(45deg);
        border-radius: 100%;
        animation: shining ${shootingTime} ease-in-out infinite;
      }

      &::after {
        content: "";
        position: absolute;
        top: calc(50% - 1px);
        right: 0;
        height: 2px;
        background: linear-gradient(
          -45deg,
          rgba(0, 0, 255, 0),
          rgba(95, 145, 255, 1),
          rgba(0, 0, 255, 0)
        );
        transform: translateX(50%) rotateZ(45deg);
        border-radius: 100%;
        animation: shining ${shootingTime} ease-in-out infinite;
        transform: translateX(50%) rotateZ(-45deg);
      }
    }
  }

  @keyframes tail {
    0% {
      width: 0;
    }

    30% {
      width: 100px;
    }

    100% {
      width: 0;
    }
  }

  @keyframes shining {
    0% {
      width: 0;
    }

    50% {
      width: 2rem;
    }

    100% {
      width: 0;
    }
  }

  @keyframes shooting {
    0% {
      transform: translateX(0);
    }

    100% {
      transform: translateX(40rem);
    }
  }
`;

export { ShooptingStarBgWrapper };
