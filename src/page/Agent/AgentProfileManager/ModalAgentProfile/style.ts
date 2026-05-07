import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ChainWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;

  img {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  span {
    font-size: 1.2rem;
  }
`;

export const OptionWrapper = styled.div`
  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 1.3rem;
    font-weight: 500;
  }

  .content {
    display: flex;
    flex-direction: column;

    .name {
      font-size: 1.3rem;
      font-weight: 500;
      display: flex;
      align-items: center;
    }

    .description {
      font-size: 1rem;
      font-weight: 400;
      display: flex;
      align-items: center;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .copy-icon {
      height: 1.2rem;
      width: 1.3rem;
      margin-left: 1.5rem;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      &.copied {
        animation: slideDown 0.3s ease-in-out;

        svg {
          fill: var(--color-success);
        }

        &:hover svg {
          fill: var(--color-success);
        }
      }

      &:hover svg {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }

      svg {
        height: 1.3rem;
        width: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
      }
    }
  }
`;

export const PortfolioAppWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-left: var(--margin-left-small);

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
`;
