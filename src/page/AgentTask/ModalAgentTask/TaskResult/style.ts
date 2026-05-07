import styled from "styled-components";
import { ITheme } from "@/style/theme";
import { markdownStyles } from "@/style/markdown";

export const Wrapper = styled.div`
  .ant-collapse {
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder} !important;
    border-radius: 0.8rem !important;
  }

  .ant-collapse > .ant-collapse-item {
    border-bottom: none !important;
  }

  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    border-radius: 0.8rem !important;
  }

  .ant-collapse-body {
    padding: 0 !important;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-left: 0.5rem;
  }

  .result-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
  }

  .result-body {
    max-height: 40rem;
    overflow-y: auto;
    padding: 1rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    ${markdownStyles}
  }
`;
