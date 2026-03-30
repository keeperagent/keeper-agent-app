import { createGlobalStyle } from "styled-components";
import { ITheme } from "@/style/theme";

const OverideAntdStyle = createGlobalStyle`
  .ant-table-wrapper {
    width: 100%;
  }

  /* Remove Ant Design scrollbar styling so global.ts ::-webkit-scrollbar rules apply to table */
  .ant-table-wrapper .ant-table {
    --ant-table-sticky-scroll-bar-bg: unset !important;
    scrollbar-color: unset !important;
  }

  .ant-input {
    border-color: transparent !important;
  }

  .ant-form-item-label label {
    font-size: 1.3rem !important;
  }

  .ant-form-item {
    margin-bottom: 1.5rem !important;
  }

  .ant-input-group-addon {
    border-radius: 4px !important;
    border: none !important;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgSecondary} !important;
  }

  .ant-btn {
    font-size: 1.3rem;
    box-shadow: none;
  }

  .ant-segmented-item-label {
    font-size: 1.3rem !important;
    display: flex;
    align-items: center;
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color:  ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextPrimary} !important;
    font-weight: 500 !important;
  }

  .ant-table-cell {
    font-size: 1.3rem;
  }

  .ant-table-expand-icon-col {
    width: 3rem !important;
  }

  .ant-form-item-explain-error {
    font-size: 1.2rem;
    margin-top: 0.7rem !important;
    margin-bottom: 0.5rem !important;
  }

  .ant-alert {
    font-size: 1.2rem !important;
  }

  .ant-steps-item-title {
    font-size: 1.2rem !important;
  }
  
  .ant-badge-count {
    padding: 0.2rem 0.8rem !important;
    height: auto !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
  }

  .ant-popconfirm-message-title {
    font-size: 1.3rem;
  }

  .ant-popconfirm-buttons > * {
    font-size: 1.1rem !important;
  }

  .ant-tooltip-inner {
    font-size: 1.1rem;
  }

  .ant-btn-sm {
    font-size: 1.2rem !important;
  }

  .ant-alert-message {
    font-size: 1.1rem;
    font-weight: 500;
  }

  .ant-tabs-nav-operations {
    display: none !important;
  }

  .ant-radio-wrapper {
    font-size: 1.3rem !important;
    margin-top: 0.4rem;
  }

  .ant-checkbox-wrapper {
    font-size: 1.3rem !important;
  }

  .ant-dropdown-menu-item-selected {
    color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextPrimary} !important;
  }

  /* Custom Primary Button: outline → fill sweep + shadow */
  .ant-btn-primary {
    position: relative;
    overflow: hidden;
    background: transparent !important;
    color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextPrimary} !important;
    border: 1px solid var(--color-primary) !important;
    transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 4px 0px 0px rgba(79, 70, 229, 0.4) !important;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--color-primary);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }

    & > * {
      position: relative;
      z-index: 1;
    }

    &:hover,
    &:focus-visible {
      box-shadow: 0px 0px 0px 0px rgba(79, 70, 229, 0.4) !important;
      color: #fff !important;

      &::before {
        transform: scaleX(1);
      }
    }

    &:active {
      box-shadow: 2px 2px 0px 0px rgba(79, 70, 229, 0.4) !important;
      color: #fff !important;
    }

    &[disabled] {
      opacity: 0.5;
      box-shadow: none !important;

      &::before {
        display: none;
      }
    }
  }

  /* Default Button: outline → neutral fill sweep, no shadow */
  .ant-btn-default {
    position: relative;
    overflow: hidden;
    background: transparent !important;
    color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorTextSecondary} !important;
    border: 1px solid ${({ theme }: { theme: ITheme }) =>
      theme?.colorBorder} !important;
    transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 3px 3px 0px 0px rgba(110, 107, 123, 0.25) !important;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: ${({ theme }: { theme: ITheme }) =>
        theme?.colorTextSecondary};
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }

    > * {
      position: relative;
      z-index: 1;
    }

    &:hover {
      color: #fff !important;
      border-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorTextSecondary} !important;
      box-shadow: 0px 0px 0px 0px rgba(110, 107, 123, 0.25) !important;

      &::before {
        transform: scaleX(1);
      }
    }

    &:active {
      color: #fff !important;
      box-shadow: 2px 2px 0px 0px rgba(110, 107, 123, 0.25) !important;
    }

    &[disabled] {
      opacity: 0.5;
      box-shadow: none !important;

      &::before {
        display: none;
      }
    }
  }

  /* Danger Button: red outline → red fill sweep */
  .ant-btn-dangerous {
    color: #ff4d4f !important;
    border-color: #ff4d4f !important;
    box-shadow: 3px 3px 0px 0px rgba(255, 77, 79, 0.25) !important;

    &::before {
      background: #ff4d4f;
    }

    &:hover {
      color: #fff !important;
      border-color: #ff4d4f !important;
      box-shadow: 0px 0px 0px 0px rgba(255, 77, 79, 0.25) !important;
    }

    &:active {
      color: #ff4d4f !important;
      box-shadow: 2px 2px 0px 0px rgba(255, 77, 79, 0.25) !important;
    }
  }
`;

export { OverideAntdStyle };
