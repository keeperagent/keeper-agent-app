import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: 1rem;
  padding: 1.8rem 2rem;

  .header {
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-search {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;

    /* Antd Form.Item's default bottom margin loses the cascade here — re-assert it. */
    .ant-form-item {
      margin-bottom: 0 !important;
    }

    > :last-child {
      width: 20rem;
    }
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .legend-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    background: transparent;
    font-size: 1.05rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    cursor: pointer;
    user-select: none;
    transition: opacity 0.15s ease;
  }

  .legend-chip.active {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .legend-chip.off {
    opacity: 0.4;
  }

  .legend-chip .swatch {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-chip .count {
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  }

  // Hidden until hovered (doesn't collide with click/double-click, already
  // used on this chip); collapsed via max-width so it reserves no dead space.
  .legend-chip .only-link {
    max-width: 0;
    margin-left: 0;
    opacity: 0;
    overflow: hidden;
    white-space: nowrap;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    color: var(--color-text-hover);
    transition:
      max-width 0.15s ease,
      margin-left 0.15s ease,
      opacity 0.1s ease;
  }

  .legend-chip:hover .only-link {
    max-width: 3rem;
    margin-left: 0.2rem;
    opacity: 1;
  }

  .legend-show-all {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 0.9rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
    cursor: pointer;
    user-select: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .graph-area {
    position: relative;
    display: flex;
  }

  .graph-canvas {
    flex: 1;
    min-width: 0;
    height: 60rem;
  }

  .zoom-controls {
    position: absolute;
    right: 1.2rem;
    top: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .zoom-button {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 0.6rem;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.3rem;
    line-height: 1;
    user-select: none;
  }

  .zoom-button:hover {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    border-color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
  }

  .stat-strip {
    position: absolute;
    left: 1.2rem;
    bottom: 1.2rem;
    display: flex;
    gap: 1.2rem;
    padding: 0.7rem 1.1rem;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    border-radius: 0.8rem;
    font-size: 1.05rem;
  }

  .stat-strip .stat {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  .stat-strip .stat b {
    font-variant-numeric: tabular-nums;
    font-size: 1.2rem;
  }

  .stat-strip .stat span {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.95rem;
  }

  .hint {
    position: absolute;
    right: 1.2rem;
    bottom: 1.2rem;
    font-size: 1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.7;
  }

  .hint.panel-open {
    display: none;
  }
`;
