import styled from "styled-components";

const Wrapper = styled.div`
  --default-position: 32px;
  --default-y: 0px;
  --icon-background-height: 19px;
  --icon-color-default: #8a91b4;
  --shadow: #{rgba(#001384, 0.16)};
  --background: var(--color-border-light);

  position: relative;
  cursor: pointer;

  &:active {
    --shadow-y: 1px;
    --shadow-blur: 2px;
    --scale-x: 0.975;
    --scale-y: 0.94;
  }

  &.marked {
    --icon-color: var(--icon-color-default);
  }

  // background animation when animated
  &:before {
    content: "";
    position: absolute;
    top: 5px;
    left: 6px;
    width: 12px;
    height: 14px;
    border-radius: 1px;
    clip-path: inset(0 -1px var(--icon-background-height) -1px round 1px);
    background: var(--icon-color, var(--icon-color-default));
    transition: background var(--duration, 0.5s) ease 0.01s;
  }

  svg {
    display: block;
    width: 24px;
    height: 28px;
    stroke: var(--icon-color, var(--icon-color-default));
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-linecap: round;
    position: relative;
    z-index: 1;
    transform: translateZ(0);
    clip-path: inset(5px 0 0 0);

    path {
      fill: var(--fill, var(--background, var(--background-default)));
      transition: fill var(--duration, 0.5s) ease 0.01s,
        stroke var(--duration, 0.5s) ease 0.01s;

      &.default {
        --fill: var(
          --default-fill,
          var(--background, var(--background-default))
        );
        clip-path: circle(var(--default-position) at 50% 100%);
      }

      &.filled {
        --fill: var(--icon-color, var(--icon-color-default));
      }

      &.default,
      &.filled {
        transform: translateY(var(--default-y));
      }
    }
  }
`;

export { Wrapper };
