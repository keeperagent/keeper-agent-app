import styled from "styled-components";

const UploadButtonWrapper = styled.div`
  .button {
    --background: #2b3044;
    --background-hover: #1e2235;
    --text: #fff;
    --icon: #fff;
    --particle: #fff;
    display: flex;
    align-items: center;
    outline: none;
    cursor: pointer;
    border: 0;
    min-width: 9rem;
    padding: 0.4rem 1rem 0.6rem 0.5rem;
    border-radius: 0.7rem;
    height: 3.2rem;
    font-family: inherit;
    font-size: 1.2rem;
    color: var(--text);
    background: var(--color-primary);
    transition: transform 0.3s, background 0.4s;
    transform: scale(var(--scale, 1)) translateZ(0);

    &:active {
      --scale: 0.95;
    }
    &:hover {
      --b: var(--background-hover);
    }
    .icon {
      --arrow-y: 0;
      --arrow-rotate: 135;
      --arrow-top: 10px;
      width: 24px;
      height: 24px;
      position: relative;
      display: inline-block;
      vertical-align: top;
      margin-right: 0.1rem;
      pointer-events: none;
      .dot {
        border-radius: 50%;
        background: #fff;
        background: var(--particle);
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 4px;
      }
      .arrow,
      .line {
        position: absolute;
        z-index: 1;
      }
      .arrow {
        left: 11px;
        top: 4px;
        width: 2px;
        height: 12px;
        border-radius: 1px;
        background: var(--icon);
        transform: translateY(calc(var(--arrow-y) * 1px)) translateZ(0);
        &:before,
        &:after {
          content: "";
          width: 2px;
          height: 6px;
          position: absolute;
          left: 0;
          top: var(--arrow-top);
          border-radius: 1px;
          background: inherit;
          transform-origin: 1px 1px;
          transform: rotate(var(--r, calc(var(--arrow-rotate) * 1deg)));
          border: 1px solid var(--icon);
        }
        &:after {
          --r: calc(var(--arrow-rotate) * -1deg);
        }
      }
      .line {
        width: 2rem;
        height: 2.4rem;
        display: block;
        left: 2px;
        top: 7px;
        fill: none;
        stroke: var(--icon);
        stroke-width: 2;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
    }
    &.upload {
      .icon {
        --arrow-rotate: 45;
        --arrow-top: 0;
      }
    }
  }
`;

export { UploadButtonWrapper };
