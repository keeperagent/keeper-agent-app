import { createGlobalStyle } from "styled-components";
import { ITheme } from "@/style/theme";
import { LOCALE } from "@/language";

type IProps = {
  locale: string;
  theme: ITheme;
};

const GlobalStyle = createGlobalStyle`
  html,
  body {
    padding: 0;
    margin: 0;
    font-family: var(--text-font-primary) !important;
    font-size: 62.5%;
    width: 100%;
    max-width: 100vw;
    margin: 0;
    padding: 0;

    & * {
      font-family:${({ locale }: IProps) =>
        locale === LOCALE.EN
          ? "var(--text-font-primary)"
          : "var(--text-font-secondary)"} !important;
    }
  }

  * {
    box-sizing: border-box;
  }

  /* change default color when select text */
  ::selection {
    background: var(--color-primary) !important;
    color: var(--white) !important;
  }

  ::-moz-selection { /* Code for Firefox */
    background: var(--color-primary) !important;
    color: var(--white) !important;
  }

  :root {
    --text-font-primary: "JetBrains Mono", monospace;
    --text-font-secondary: 'Open Sans', sans-serif;
    --color-text: #212A3E;
    --color-text-secondary: #6E6B7B;
    --color-text-hover: #F59E0B;;
    --color-primary: rgba(79, 70, 229, 1);
    --color-secondary: #F7EBFF;
    --color-primary-light: #867ae9;
    --color-text-white-light: rgb(242, 242, 230);
    --color-text-white: rgb(255, 255, 255);
    --color-gray: #6e6b7b;
    --color-white: #ffffff;
    --color-background-gray: #f2f2f2;
    --color-bg-dark: rgba(48, 48, 48, 0.4);
    --color-bg-gray: rgba(32, 32, 32, 0.9);
    --color-bg-primary: rgba(133, 122, 233, 0.15);
    --box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.05);
    --box-shadow-large: 0px 0px 20px rgba(0, 0, 0, 0.1);
    --border-radius: 0.6rem;
    --border-radius-1: 1rem;
    --padding: 1.5rem 2rem;
    --padding-taller: 2.5rem 2rem;
    --padding-wider: 1.5rem 3rem;
    --padding-small: 1.5rem 1.5rem;
    --padding-page: 2rem 3rem;
    --padding-page-small: 2rem 1.5rem;
    --margin-bottom: 1.5rem;
    --margin-bottom-small: 1rem;
    --margin-bottom-large: 2.5rem;
    --margin-right: 1.5rem;
    --margin-right-small: 1rem;
    --margin-left: 1.5rem;
    --margin-left-small: 1rem;
    --margin-top: 1.5rem;
    --margin-top-small: 1rem;
    --margin-top-large: 2rem;
    --color-blue-light: #eaf4ff;
    --color-orange-light: #ffefe0;
    --color-border-light: #f5f5f5de;
    --color-border: #e8e8e8;
    --color-orange-red: #FF6767;
    --color-pink: rgb(145, 107, 191);
    --color-success: #7FC8A9;
    --color-error: #FF6767;
    --color-yellow: #fcba03;
    --color-brown: rgb(197, 104, 36);
    --color-blue: rgb(92, 122, 234);
    --background-success: rgba(127, 200, 169, 0.3);
    --background-error: rgba(255, 103, 103, 0.3);
    --background-yellow: rgba(255, 244, 125, 0.6);
    --background-pink: rgb(145, 107, 191, 0.15);
    --background-blue: rgb(92, 122, 234, 0.3);
    --background-brown: rgb(197, 104, 36, 0.3);
    --background-dark-light: rgba(0, 0, 0, 0.03);
    --telegram-color: #229ED9;

    --white: #FFF;
    --green: #16BF78;
    --grey-light: #CDD9ED;
    --grey-dark: #3F4656;
    --primary-light: #7699FF;
    --dark: #1C212E;
    --sand-light: #EDD9A9;
    --sand: #DCB773;
  }

  .custom-input {
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTransparent} !important;
    border-radius: 0.4rem !important;
    font-weight: 500 !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
    font-size: 1.3rem !important;
    
    input {
      font-weight: 500 !important;
      font-size: 1.3rem !important;
      background: transparent !important;
    }

    &:hover, &:focus {
      border: 1px solid ${({ theme }: { theme: ITheme }) =>
        theme?.colorBorderInput} !important;
    }

    &[disabled] {
      background:  ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgInputDisable} !important;
      color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorTextSecondary} !important;
    }
  }

  .custom-input-number {
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTransparent} !important;
    border-radius: 0.4rem !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
    font-size: 1.3rem !important;

    input {
      font-weight: 500 !important;
      height: 35px !important;
    }

    &:hover, &:focus {
      border: 1px solid var(--color-primary) !important;
    }

    &.ant-input-number-disabled {
      background-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTransparent} !important;

      &:hover, &:focus {
        border: 1px solid transparent!important;
      }
    }
  }

  .custom-date-picker {
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTransparent} !important;
    border-radius: 0.4rem !important;
    outline: none !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
    
    .ant-picker-input * {
      font-size: 1.3rem !important;
      font-weight: 500 !important;
    }
  }

  .custom-select {
    width: 100%;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    box-shadow: none !important;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTransparent} !important;
    font-size: 1.3rem !important;
    line-height: 2.2rem !important;
    border: 1px solid transparent !important;

    .ant-select-selection-item {
      font-weight: 400;
    }

    &.ant-select-disabled {
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgInputDisable} !important;
      border-radius: 0.4rem !important;
    }
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
    }

    50% {
      transform: rotate(0deg);
    }

    70% {
      transform: rotate(-10deg);
    }

    90% {
      transform: rotate(10deg);
    }

    100% {
      transform: rotate(0deg);
    }
  }

  .highlight {
    background-color: var(--color-yellow);
  }

  /* style for scrollbar */
  ::-webkit-scrollbar {
    width: 0.5rem !important;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }: { theme: ITheme }) => theme?.scrollBarThumbColor} !important;
    border-radius: 1px !important;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }: { theme: ITheme }) => theme?.scrollBarTrackColor} !important;
    border-radius: 1px !important;
  }

  ::-webkit-scrollbar:horizontal {
    height: 0.5rem !important;
  }

  ::-webkit-scrollbar-thumb:horizontal {
    border-radius: 1px !important;
  }

  ::-webkit-scrollbar-corner {
    background-color: rgba(0, 0, 0, 0.1) !important;
  }

  /* react flow */
  .react-flow__attribution {
    display: none;
  }

  @keyframes slideDown {
    0% {
      transform: translateY(-50%);
    }
    50% {
      transform: translateY(8%);
    }
    65% {
      transform: translateY(-4%);
    }
    80% {
      transform: translateY(4%);
    }
    95% {
      transform: translateY(-2%);
    }
    100% {
      transform: translateY(0%);
    }
  }
`;

export { GlobalStyle };
