import styled from "styled-components";
import { ITheme } from "@/style/theme";

const SearchInputWrapper = styled.div`
  .input {
    --border-default: #d0d0df;
    --border-active: #3d6df9;
    --shadow-default: rgba(32, 32, 72, 0.12);
    --shadow-active: rgba(61, 109, 249, 0.25);
    --placeholder-color: #c9c9d9;
    --placeholder-color-hover: #babac9;
    --close: #818190;
    --close-light: #babac9;
    --close-background: ${({ theme }) => theme.clearBtnColorHover};
    --background: ${({ theme }) => theme.clearBtnColorHover};
    --clear-x: 0px;
    --clear-swipe-left: 0px;
    --clear-swipe-x: 0;
    --clear-swipe: 0px;
    --clear-scale: 0;
    --clear-rotate: 0deg;
    --clear-opacity: 0;
    --clear-arrow-o: 1;
    --clear-arrow-x: 0px;
    --clear-arrow-y: 0px;
    --clear-arrow-offset: 4px;
    --clear-arrow-offset-second: 4px;
    --clear-line-array: 8.5px;
    --clear-line-offset: 27px;
    --clear-long-array: 8.5px;
    --clear-long-offset: 24px;
    height: 3.7rem;
    display: flex;
    align-items: center;
    position: relative;
    border-radius: 4px;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTransparent} !important;
    transition: box-shadow 0.2s;
    border: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorderSecondary};
  }

  .input.clearing,
  .input:focus-within {
    --border-width: 1.5px;
    border: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorderInput};
    --shadow: var(--shadow-active);
  }

  .input.clearing {
    --clear-arrow-stroke: var(--close-light);
  }

  .input .text {
    flex-grow: 1;
  }

  .input .text input {
    -webkit-appearance: none;
    line-height: 24px;
    background: none;
    border: none;
    outline: none;
    display: block;
    width: 100%;
    margin: 0;
    padding: 12px 10px;
    font-family: inherit;
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colorTextPrimary};
  }

  .input .text input::-moz-placeholder {
    color: var(--placeholder-color);
    -moz-transition: color 0.2s;
    transition: color 0.2s;
  }

  .input .text input:-ms-input-placeholder {
    color: var(--placeholder-color);
    -ms-transition: color 0.2s;
    transition: color 0.2s;
  }

  .input .text input::placeholder {
    color: var(--placeholder-color);
    transition: color 0.2s;
  }

  .input:hover .text input::-moz-placeholder {
    color: var(--placeholder-color-hover);
  }

  .input:hover .text input:-ms-input-placeholder {
    color: var(--placeholder-color-hover);
  }

  .input:hover .text input::placeholder {
    color: var(--placeholder-color-hover);
  }

  .input .clear {
    -webkit-appearance: none;
    position: relative;
    outline: none;
    z-index: 1;
    padding: 0;
    margin: 12px 12px 12px 0;
    border: none;
    background: var(--background);
    height: 2.1rem;
    width: 2.1rem;
    transition: background 0.2s;
    border-radius: 50%;
    opacity: var(--clear-opacity);
    transform: scale(var(--clear-scale)) translateZ(0);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .input .clear:before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 12px;
    left: var(--clear-swipe-left);
    transform-origin: 100% 50%;
    transform: translateX(var(--clear-swipe)) scaleX(var(--clear-swipe-x))
      translateZ(0);
    background-color: rgba(133, 122, 233, 0.0001);
  }

  .input .clear svg {
    display: block;
    position: relative;
    z-index: 1;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
    outline: none;
    cursor: pointer;
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: var(--close);
    transform: translateX(var(--clear-x)) rotate(var(--clear-rotate))
      translateZ(0);
  }

  .input .clear svg path {
    transition: stroke 0.2s;
  }

  .input .clear svg path.arrow {
    stroke: var(--clear-arrow-stroke, var(--close));
    stroke-dasharray: 4px;
    stroke-dashoffset: var(--clear-arrow-offset);
    opacity: var(--clear-arrow-o);
    transform: translate(var(--clear-arrow-x), var(--clear-arrow-y))
      translateZ(0);
  }

  .input .clear svg path.arrow:last-child {
    stroke-dashoffset: var(--clear-arrow-offset-second);
  }

  .input .clear svg path.line {
    stroke-dasharray: var(--clear-line-array) 28.5px;
    stroke-dashoffset: var(--clear-line-offset);
  }

  .input .clear svg path.long {
    stroke: var(--clear-arrow-stroke, var(--close));
    stroke-dasharray: var(--clear-long-array) 15.5px;
    stroke-dashoffset: var(--clear-long-offset);
    opacity: var(--clear-arrow-o);
    transform: translate(var(--clear-arrow-x), var(--clear-arrow-y))
      translateZ(0);
    stroke: var(--close);
  }
`;

export { SearchInputWrapper };
