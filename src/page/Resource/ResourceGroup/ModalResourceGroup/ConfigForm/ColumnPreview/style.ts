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
    transform: scaleY(0.95) rotateZ(5deg);

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

    .horizon-line {
      border-bottom: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      height: 1.5rem;
    }
  }
`;

export { ColumnPreviewWrapper };
