import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ColumnPreviewWrapper = styled.div`
  flex-basis: 10%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &.active {
    transform: translateY(-1rem);

    .grid {
      background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
    }
  }

  &:first-of-type {
    .grid {
      border-left: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    }
  }

  .valid {
    margin-bottom: 0.5rem;
    height: 3px;
    margin-left: 1px;
    margin-right: 1px;
  }

  .invalid {
    margin-top: 0.5rem;
    height: 3px;
    margin-left: 1px;
    margin-right: 1px;
  }

  .label {
    font-size: 1rem;
    font-weight: 500;
    color: white;
    padding: 0.2rem 0.1rem;
    text-align: center;
  }

  .grid {
    border-right: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    .horizon-line {
      border-bottom: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      height: 1.5rem;
    }
  }
`;

export { ColumnPreviewWrapper };
