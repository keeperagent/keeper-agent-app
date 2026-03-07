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
`;

export { OverideAntdStyle };
