import styled from "styled-components";
import { ITheme } from "@/style/theme";

const HoverLinkWrapper = styled.span`
  --line: #bbc1e1;
  --line-active: var(--color-primary);
  --spacing: 11px;

  font-size: 1.1rem;
  margin: 0;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  font-weight: 500;

  .link {
    display: inline-block;
    position: relative;
    text-decoration: none;
    color: inherit;
    margin: 0 var(--spacing, 0px);
    transition: margin 0.25s;
    font-weight: 600;
    color: var(--telegram-color);
    cursor: pointer;

    svg {
      height: 30px;
      position: absolute;
      left: 50%;
      bottom: 2px;
      transform: translate(-50%, 7px) translateZ(0);
      fill: none;
      stroke: var(--stroke, var(--line));
      stroke-linecap: round;
      stroke-width: 2px;
      stroke-dasharray: var(--offset, 69px) 278px;
      stroke-dashoffset: 361px;
      transition: stroke 0.25s ease var(--stroke-delay, 0s),
        stroke-dasharray 0.35s;
    }

    &:hover {
      --spacing: 13px;
      --stroke: var(--line-active);
      --stroke-delay: 0.1s;
      --offset: 180px;
    }
  }
`;

export { HoverLinkWrapper };
