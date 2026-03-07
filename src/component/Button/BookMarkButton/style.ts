import styled from "styled-components";

const BookMarkButtonWrapper = styled.button`
  --default-position: 32px;
  --default-y: 0px;
  --icon-background-height: 19px;
  --background-default: #1e2235;
  --background-hover: #171827;
  --text-color: #f9faff;
  --icon-color-default: #8a91b4;
  --icon-color-active: #f04949;
  --shadow: #{rgba(#001384, 0.16)};

  outline: none;
  border: none;
  background: #1e2235;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  border-radius: 5px;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    backface-visibility: hidden;
    box-shadow: 0 var(--shadow-y, 2px) var(--shadow-blur, 3px) var(--shadow);
    transform: scale(var(--scale-x, 1), var(--scale-y, 1)) translateZ(0);
    transition: box-shadow 0.2s,
      transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s;
  }

  &:active {
    --shadow-y: 1px;
    --shadow-blur: 2px;
    --scale-x: 0.975;
    --scale-y: 0.94;
  }

  &:hover {
    --background: var(--background-hover);
  }

  &.marked {
    --icon-color: var(--icon-color-default);
  }

  .text {
    margin-left: 1rem;
  }

  .icon {
    position: relative;
    z-index: 1;
    transform: scale(0.8);
    left: -1px;

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
      min-width: 24px;
      min-height: 28px;
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
  }

  span {
    position: relative;
    z-index: 1;
    left: -9px;
  }
`;

export { BookMarkButtonWrapper };
