import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const DetailPanelWrapper = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  z-index: 2;
  width: 31rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  /* background is theme-aware and set inline at the usage site (glass effect). */
  padding: 1.6rem 1.8rem;
  overflow-y: auto;

  .panel-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .panel-kind {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    margin-bottom: 0.4rem;
  }

  .panel-kind .swatch {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
  }

  .panel-name {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.2rem;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    word-break: break-word;
  }

  .panel-name-portfolio-icon {
    width: 1.4rem;
    height: 1.4rem;
    flex-shrink: 0;
    cursor: pointer;
  }

  .panel-name-clickable {
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .panel-name-clickable:hover {
    color: var(--color-text-hover);
  }

  .panel-close {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    background: transparent;
  }

  .panel-close:hover {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    border-color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
  }

  .panel-rows {
    margin-top: 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .prow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.9rem;
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }

  .prow .k {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-size: 1.05rem;
  }

  .prow .v {
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .panel-section-label {
    margin-top: 1.6rem;
    margin-bottom: 0.7rem;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.8;
  }

  // Flat tinted surfaces, not a stroked pill — "primary" solid fill,
  // "secondary" a ghost tint that brightens on hover.
  .cta-row {
    margin-top: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.2rem;
    border-radius: 0.8rem;
    font-size: 1.1rem;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease;
  }

  .cta-row:hover {
    transform: translateY(-1px);
  }

  .cta-row-primary {
    background: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
    color: #ffffff;
  }

  .cta-row-primary:hover {
    box-shadow: 0 0.5rem 1.4rem
      ${({ theme }: { theme: ITheme }) => theme?.colorPrimary}66;
  }

  .cta-row-secondary {
    background: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary}1a;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
  }

  .cta-row-secondary:hover {
    background: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary}33;
  }

  // The arrow glyph as a small circular chip that nudges right on hover,
  // rather than a static glyph sitting flush against the row's edge.
  .cta-row .cta-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    flex-shrink: 0;
    transition: transform 0.15s ease;
  }

  .cta-row-primary .cta-arrow {
    background: rgba(255, 255, 255, 0.2);
  }

  .cta-row-secondary .cta-arrow {
    background: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary}26;
  }

  .cta-row:hover .cta-arrow {
    transform: translateX(0.2rem);
  }

  .related-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .related-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.05rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .related-item .swatch {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .related-item b {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-weight: 500;
    flex: 1;
    min-width: 0;
  }

  .related-item .related-portfolio-icon {
    flex-shrink: 0;
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
  }

  .related-item .related-type {
    flex-shrink: 0;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    font-size: 0.85rem;
    text-transform: lowercase;
  }

  .related-more {
    margin-top: 0.8rem;
    font-size: 0.95rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.8;
  }
`;
