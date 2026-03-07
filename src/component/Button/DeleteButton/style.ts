import styled from "styled-components";

interface BtnProps {
  disabled?: boolean;
  loading?: boolean;
}

const DeleteButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  border: none;
  outline: none;
  background: none;
  padding: 0.4rem 2.3rem;
  border-radius: var(--border-radius);
  white-space: nowrap;
  color: var(--color-text-white);
  background: var(--color-orange-red);
  transform: scale(1);
  transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
  opacity: ${(props: BtnProps) => (props?.disabled ? 0.7 : 1)};
  cursor: ${(props: BtnProps) =>
    props?.loading || props?.disabled ? "not-allowed" : "pointer"};

  span {
    font-size: 1.3rem;
    line-height: 2.5rem;
    font-weight: 500;
    opacity: var(--span-opacity, 1);
    transform: translateX(var(--span-x, 0)) translateZ(0);
    transition: transform 0.4s ease var(--span-delay, 0.2s),
      opacity 0.3s ease var(--span-delay, 0.2s);
  }

  .trash {
    position: relative;
    left: -8px;
    transform: translate(var(--trash-x, 0), var(--trash-y, 1px)) translateZ(0)
      scale(var(--trash-scale, 0.64));
    transition: transform 0.5s;

    &:before,
    &:after {
      content: "";
      position: absolute;
      height: 0.7rem;
      width: 3px;
      border-radius: 1px;
      background: var(--color-text-white);
      bottom: 100%;
      transform-origin: 50% 6px;
      transform: translate(var(--x, 3px), 2px) scaleY(var(--sy, 0.7))
        rotate(var(--r, 0deg));
      transition: transform 0.4s, background 0.3s;
    }

    &:before {
      left: 1px;
    }

    &:after {
      right: 1px;
      --x: -3px;
    }

    .top {
      position: absolute;
      overflow: hidden;
      left: -4px;
      right: -4px;
      bottom: 100%;
      height: 3rem;
      z-index: 1;
      transform: translateY(2px);

      &:before,
      &:after {
        content: "";
        position: absolute;
        border-radius: 1px;
        background: var(--color-text-white);
        width: var(--w, 1.2rem);
        height: var(--h, 2px);
        left: var(--l, 0.8rem);
        bottom: var(--b, 5px);
        transition: background 0.3s, transform 0.4s;

        @media only screen and (max-width: 550px) {
          left: var(--l, 0.6rem);
        }
      }

      &:after {
        --w: 2.8rem;
        --h: 2px;
        --l: 0;
        --b: 0;
        transform: scaleX(var(--trash-line-scale, 1));
      }

      .paper {
        width: 1.4rem;
        height: 1.8rem;
        background: var(--color-primary);
        left: 7px;
        bottom: 0;
        border-radius: 1px;
        position: absolute;
        transform: translateY(-1.6rem);
        opacity: 0;

        &:before,
        &:after {
          content: "";
          width: var(--w, 1rem);
          height: 2px;
          border-radius: 1px;
          position: absolute;
          left: 2px;
          top: var(--t, 2px);
          background: var(--color-text-white);
          transform: scaleY(0.7);
          box-shadow: 0 9px 0 var(--color-text-white);
        }

        &:after {
          --t: 5px;
          --w: 7px;
        }
      }
    }

    .box {
      width: 2rem;
      height: 2.5rem;
      border: 2px solid var(--color-text-white);
      border-radius: 1px 1px 4px 4px;
      position: relative;
      overflow: hidden;
      z-index: 2;
      transition: border-color 0.3s;
      transform: scale(0.9);

      &:before,
      &:after {
        content: "";
        position: absolute;
        width: 4px;
        height: var(--h, 2rem);
        top: 0;
        left: var(--l, 50%);
        background: var(--b, var(--color-text-white));
      }

      &:before {
        border-radius: 2px;
        margin-left: -2px;
        transform: translateX(-3px) scale(0.6);
        box-shadow: 1rem 0 0 var(--color-text-white);
        opacity: var(--trash-lines-opacity, 1);
        transition: transform 0.4s, opacity 0.4s;
      }

      &:after {
        --h: 1.6rem;
        --b: var(--color-primary);
        --l: 1px;
        transform: translate(-0.5px, -1.6rem) scaleX(0.5);
        box-shadow: 7px 0 0 var(--color-primary),
          1.4rem 0 0 var(--color-primary), 2.1rem 0 0 var(--color-primary);
      }
    }
  }

  &.delete {
    --span-opacity: 0;
    --span-x: 1.6rem;
    --span-delay: 0s;
    --trash-y: 2px;
    --trash-scale: 0.8;
    --trash-lines-opacity: 0;
    --trash-line-scale: 0;
    --icon: #fff;
    --trash-x: 3rem;

    .trash {
      &:before,
      &:after {
        --sy: 1;
        --x: 0;
      }

      &:before {
        --r: 40deg;
      }

      &:after {
        --r: -40deg;
      }

      .top {
        .paper {
          animation: paper 1.5s linear forwards 0.5s;
        }
      }

      .box {
        &:after {
          animation: cut 1.5s linear forwards 0.5s;
        }
      }
    }
  }

  @keyframes paper {
    10%,
    100% {
      opacity: 1;
    }
    20% {
      transform: translateY(-1.6rem);
    }
    40% {
      transform: translateY(0);
    }
    70%,
    100% {
      transform: translateY(24px);
    }
  }

  @keyframes cut {
    0%,
    40% {
      transform: translate(-0.5px, -1.6rem) scaleX(0.5);
    }
    100% {
      transform: translate(-0.5px, 2.4rem) scaleX(0.5);
    }
  }
`;

export { DeleteButtonWrapper };
