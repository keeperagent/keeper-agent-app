import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius);
  cursor: pointer;
  border: 1px solid transparent;

  .title {
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    text-transform: uppercase;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.7rem;
    display: flex;
    align-items: center;

    .color {
      width: 1.3rem;
      height: 1.3rem;
      margin-right: 0.7rem;
      border-radius: 2px;
    }

    span {
      margin-top: 1px;
    }
  }

  .detail {
    .item {
      font-size: 1.2rem;
      margin-bottom: 0.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      display: flex;
      font-weight: 500;

      .label {
        margin-right: 0.4rem;
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
        font-weight: 400;
      }
    }
  }
`;

export { Wrapper };
