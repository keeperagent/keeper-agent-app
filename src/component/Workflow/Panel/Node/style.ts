import styled from "styled-components";
import { ITheme } from "@/style/theme";

const NodeWrapper = styled.div`
  border-radius: var(--border-radius);
  margin-bottom: var(--margin-bottom);
  padding: 0.9rem 1.3rem;
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  background-color: ${({ theme }: { theme: ITheme }) =>
    theme?.colorBgSecondary};
  transition: all 0.2s ease-in-out;

  &:hover,
  &.selected {
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgPrimary};
    border: 1px dashed ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};

    .name {
      color: var(--color-text-hover);
    }

    .drag {
      svg {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }

  &.selected {
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
  }

  .icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme?.colorBgTransparent};
    border-radius: 50%;

    svg {
      width: 1.35rem;
      height: 1.35rem;
      min-width: 1.35rem;
      min-height: 1.35rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }

  .name {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .drag {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    transform: scaleY(1.1);

    svg {
      width: 1.1rem;
      height: 1.1rem;
      min-width: 1.1rem;
      min-height: 1.1rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }
  }

  .bookmark {
    margin-left: auto;
  }
`;

export { NodeWrapper };
