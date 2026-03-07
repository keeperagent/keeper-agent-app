import styled from "styled-components";
import { ITheme } from "@/style/theme";

const LabelWrapper = styled.div`
  background-color: ${({ theme }: { theme: ITheme }) => theme.colorBgNode};
  font-size: 0.7rem;
  border-radius: 1px;
  box-shadow: ${({ theme }: { theme: ITheme }) => theme.boxShadowNode};
  width: 7rem;
  z-index: 2;

  &.selected {
    border: 0.1px solid var(--color-primary);
  }

  .header {
    display: flex;
    align-items: flex-end;
    background-color: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
    padding: 3px 3px;
    border-radius: 1px 1px 0 0;

    .value {
      font-size: 0.4rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      margin-right: 2px;
    }
  }

  .content {
    font-size: 0.6rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3px 3px;

    .text {
      font-weight: 700;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};

      span {
        font-size: 0.5rem;
        font-weight: 400;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      }
    }

    .line {
      margin-top: 2px;
      height: 2px;
      display: flex;

      .process {
        background-color: var(--color-success);
        border-radius: 0.5px 0 0 0.5px;
        transition: all 0.2s ease-in;
      }

      .total {
        background-color: var(--background-success);
        border-radius: 0 0.5px 0.5px 0;
        transition: all 0.2s ease-in;
      }
    }
  }
`;

export { LabelWrapper };
