import { css } from "styled-components";
import { ITheme } from "./theme";

export const markdownStyles = css`
  white-space: normal;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1rem 0 0.5rem 0;
    font-weight: 600;
    line-height: 1.3;
  }
  h1,
  h2 {
    font-size: 1.4rem;
  }
  h3,
  h4,
  h5,
  h6 {
    font-size: 1.25rem;
  }
  h1:first-child,
  h2:first-child,
  h3:first-child {
    margin-top: 0;
  }

  a {
    color: var(--primary-light);
  }

  p {
    margin: 0.5rem 0;
  }
  p:first-child {
    margin-top: 0;
  }
  p:last-child {
    margin-bottom: 0;
  }

  strong {
    font-weight: 600;
  }

  code {
    background: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTag || "rgba(0,0,0,0.08)"};
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 1.2rem;
    color: var(--color-error);
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }
  pre {
    margin: 0.75rem 0;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    background: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTag || "rgba(0,0,0,0.06)"};
  }
  pre code {
    background: none;
    padding: 0;
    border: none;
    color: inherit;
  }

  ul,
  ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  li {
    margin: 0.5rem 0;
  }

  table {
    width: 100%;
    margin: 0.75rem 0;
    border-collapse: collapse;
    font-size: 1.2rem;
  }
  th,
  td {
    border: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder || "#eee"};
    padding: 0.4rem 0.6rem;
    text-align: left;
  }
  th {
    font-weight: 600;
    background: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTag || "rgba(0,0,0,0.04)"};
  }
`;
