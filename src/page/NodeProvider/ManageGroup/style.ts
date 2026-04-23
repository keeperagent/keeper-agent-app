import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 1.7rem;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: var(--margin-right);
    }

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      cursor: pointer;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }
`;

const LinkHoverWrapper = styled.span`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .note {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }
`;

const ChainWrapper = styled.div`
  display: flex;
  align-items: center;

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .chain-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .text {
    font-size: 1.2rem;
  }

  .chain-id {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }
`;

export { PageWrapper, LinkHoverWrapper, ChainWrapper };
