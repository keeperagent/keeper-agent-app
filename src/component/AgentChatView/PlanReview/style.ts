import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-top: 1.5rem;
  border: 2px dashed ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: var(--border-radius);
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
  display: flex;
  flex-direction: column;
  max-height: 28rem;
  overflow-y: auto;

  .plan-review-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0;

    .plan-review-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .plan-review-title-block {
      flex: 1;
      min-width: 0;
    }

    .plan-review-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      line-height: 1.4;
      color: var(--color-text-hover);
    }

    .plan-review-desc {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-top: 0.1rem;
      line-height: 1.4;
    }
  }

  .plan-review-body {
    flex: 1;
    padding: 1rem 1.2rem;
    font-size: 1.25rem;
    line-height: 1.7rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    word-break: break-word;

    .plan-review-plan-box {
      padding: 0.8rem 1rem;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 0.8rem 0 0.4rem 0;
      font-weight: 600;
      font-size: 1.35rem;
    }
    h1:first-child,
    h2:first-child,
    h3:first-child {
      margin-top: 0;
    }
    p {
      margin: 0.4rem 0;
    }
    p:first-child {
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    ul,
    ol {
      margin: 0.4rem 0;
      padding-left: 1.4rem;
    }
    li {
      margin: 0.3rem 0;
    }
    strong {
      font-weight: 600;
    }
    code {
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      font-size: 1.15rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 1.2rem;
      margin: 0.5rem 0;
    }
    th,
    td {
      border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      padding: 0.3rem 0.6rem;
      text-align: left;
    }
    th {
      font-weight: 600;
      background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
    }
  }

  .plan-review-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
    position: sticky;
    bottom: 0;
    z-index: 1;
    flex-shrink: 0;
  }
`;

export { Wrapper };
