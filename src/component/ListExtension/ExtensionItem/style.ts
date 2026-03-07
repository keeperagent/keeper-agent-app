import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ItemWrapper = styled.div`
  border: 1px solid green;
  width: 100%;
  display: flex;
  border-radius: 5px;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  padding: 1rem 2rem;
  position: relative;

  .logo {
    display: flex;
    align-items: center;
    margin-right: 1.5rem;

    img {
      height: 2.5rem;
      width: 2.5rem;
    }
  }

  .info {
    width: 100%;
    display: flex;
    flex-direction: column;

    .name {
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }

    .description {
      font-size: 1rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    }
  }

  .close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    height: 2.3rem;
    width: 2.3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.3rem;
    cursor: pointer;

    &:hover {
      svg {
        fill: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      }
    }

    svg {
      height: 2.3rem;
      width: 2.3rem;
      min-width: 2.3rem;
      min-height: 2.3rem;
      fill: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    }
  }
`;

export { ItemWrapper };
