import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  display: flex;
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  padding: 1.2rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  border: 1px solid transparent;

  &.dark-mode {
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }

  &:hover {
    border: 1px dashed
      ${({ theme }: { theme: ITheme }) => theme?.colorBorderInput};
  }

  img {
    width: 3.5rem;
    height: 3.5rem;
    margin-right: 0.5rem;
  }

  .detail {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;

    .name {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    .statistic {
      display: flex;
      justify-content: space-between;

      .last-edit {
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }

      .size {
        font-size: 1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        font-weight: 500;
      }
    }
  }
`;

export { Wrapper };
