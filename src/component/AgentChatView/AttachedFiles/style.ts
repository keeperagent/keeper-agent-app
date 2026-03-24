import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const AttachedFilesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  width: 100%;
  margin-bottom: 0.75rem;
`;

export const AttachedFileCard = styled.div`
  position: relative;
  width: 9rem;
  height: 9rem;
  border-radius: 0.8rem;
  overflow: hidden;
  background: ${({ theme }: { theme: ITheme }) =>
    theme?.colorBgPrimary || "#fff"};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  flex-shrink: 0;

  .card-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    margin: 0;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: #fff;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }

  .card-preview {
    width: 100%;
    height: 100%;
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
  }

  .card-preview--clickable {
    cursor: pointer;
  }

  .card-preview--image {
    padding: 0;

    img {
      width: 100%;
      height: 96px;
      object-fit: cover;
      display: block;
    }
  }

  .card-preview--other {
    flex-direction: column;
    gap: 0;
    background: linear-gradient(
      180deg,
      ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary || "#fff"} 0%,
      ${({ theme }: { theme: ITheme }) => theme?.colorBgTag || "#f8f8f8"} 100%
    );
    position: relative;
    padding: 22px 8px 10px;

    /* Document lines – repeating horizontal */
    &::before {
      content: "";
      position: absolute;
      top: 20px;
      left: 12px;
      right: 12px;
      bottom: 10px;
      border-radius: 2px;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 6px,
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder || "#e8e8e8"} 6px,
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder || "#e8e8e8"} 9px
      );
      opacity: 0.5;
      pointer-events: none;
    }

    .card-extension {
      position: absolute;
      top: 5px;
      left: 5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      padding: 3px 5px;
      font-size: 8px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #455a64 0%, #607d8b 100%);
      border-radius: 3px;
      letter-spacing: 0.04em;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .card-filename {
      position: absolute;
      bottom: 1.5rem;
      left: 0.5rem;
      right: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      padding: 0;
      margin: 0;
    }
  }

  .card-filename {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
  }
`;
