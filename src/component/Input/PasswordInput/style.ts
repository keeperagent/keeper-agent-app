import styled from "styled-components";
import { Form } from "antd";
import { ITheme } from "@/style/theme";

const PasswordInputWrapper = styled(Form.Item)`
  .ant-form-item {
    margin-bottom: 0 !important;
  }

  .password-field {
    --c-text: #5a5a64;
    --c-text-light: #a1a1b6;
    --c-text-selection: #09abc3;
    --c-background: #fff;
    --c-background-selection: rgba(9, 171, 195, 0.15);
    --c-border: #e2e2ed;
    --c-border-hover: #d0d0db;
    --c-border-active: #09abc3;
    --c-shadow: rgba(41, 41, 86, 0.06);
    --c-shadow-active: rgba(9, 171, 195, 0.25);
    --eye-background: 0;
    --eye-offset: 5px;
    --eye-wrapper-y: 0;
    --eye-y: 0;
    --eye-x: 0;
    --eye-s: 1;
    display: flex;
    align-items: center;
    position: relative;
    border-radius: 4px;

    &.no-margin {
      margin-bottom: 0 !important;
    }

    .ant-form-item-row {
      width: 100%;
    }

    &:hover {
      --eye-duration: 0.01s;
    }

    .input-password {
      max-height: 3.7rem;
      background-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTransparent} !important;
      font-size: 1.3rem;
      margin: 0;
      padding: 0;
      line-height: 24px;
      align-items: center;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
      border: none;
      outline: none;
      box-shadow: none;
      border: 1px solid transparent;

      .ant-input {
        padding: 0 1rem;
      }

      &:hover,
      &:focus {
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorderInput} !important;
      }
    }

    input,
    button {
      -webkit-appearance: none;
      outline: none;
      background: none;
      border: none;
      margin: 0;
      padding: 12px 10px;
    }

    input {
      display: block;
      font-family: inherit;
      line-height: 21px;
      font-weight: 500;
      transform: translateY(var(--y, var(--default-y, 0))) translateZ(0);
      opacity: var(--o, var(--default-o, 1));
      pointer-events: var(--pe, var(--default-pe, auto));
      transition:
        filter 0.35s,
        transform 0.4s,
        opacity 0.25s;

      &::placeholder {
        color: var(--color-text-secondary);
        font-size: 1.2rem;
        transition: color 0.25s;
      }

      &::selection {
        color: var(--c-text-selection);
        background: var(--c-background-selection);
      }

      &:not(.clear) {
        width: 100%;
      }

      &.clear {
        --y: var(--clear-y, 12px);
        --o: var(--clear-o, 0);
        --pe: var(--clear-pe, none);
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
      }
    }
  }
`;

const HiddenPasswordIconWrapper = styled.div`
  --eye-background: 0;
  --eye-offset: 3px;
  --eye-wrapper-y: 0;
  --eye-y: 0;
  --eye-x: 0;
  --eye-s: 1;
  height: 3.5rem;
  width: 30px;
  -webkit-font-smoothing: antialiased;

  button {
    -webkit-appearance: none;
    outline: none;
    background: none;
    border: none;
    margin: 0;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    position: absolute;
    z-index: 1;
    right: 0;
    top: 0;
    transform: scale(var(--s, 1));
    color: var(--c-text-light);
    transition:
      color 0.25s,
      transform 0.15s;
    height: 100%;

    display: flex;
    align-items: center;

    &:hover {
      color: var(--c-text);
    }

    &:active {
      --s: 0.95;
    }
  }

  svg {
    display: block;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
    pointer-events: none;

    .top,
    .bottom,
    .lashes {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5px;
      stroke-linecap: round;
    }

    .lashes {
      fill: none;
      stroke: currentColor;
      stroke-dasharray: 3px;
      stroke-dashoffset: var(--eye-offset);
    }

    .top {
      fill: transparent;
      fill-opacity: var(--eye-background);
    }

    .eye {
      fill: currentColor;
      transform-origin: 10.5px 13.5px;
      transform: translate(var(--eye-x), var(--eye-y)) scale(var(--eye-s))
        translateZ(0);
      transition: transform var(--eye-duration, 0.3s);
    }
  }

  .show {
    --default-y: -12px;
    --default-o: 0;
    --default-pe: none;
    --clear-y: 0;
    --clear-o: 1;
    --clear-pe: auto;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;

  .circle {
    border-radius: 50%;
    width: 1.3rem;
    height: 1.3rem;
    content: "";
    margin-right: 1rem;
  }
`;

const TooltipWrapper = styled.div`
  display: flex;
  flex-direction: column;

  .title {
  }

  .item {
    display: flex;
    margin-top: 0.5rem;

    .circle {
      border-radius: 50%;
      width: 1.3rem;
      height: 1.3rem;
      content: "";
      margin-right: 1rem;
    }

    .value {
    }
  }
`;

export {
  PasswordInputWrapper,
  HiddenPasswordIconWrapper,
  IconWrapper,
  TooltipWrapper,
};
