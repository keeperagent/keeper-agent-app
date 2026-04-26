import styled from "styled-components";
import { ITheme } from "@/style/theme";

const WalletViewWrapper = styled.div`
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: var(--border-radius);
  padding: var(--padding);

  .divider {
    margin: 1.5rem 0 !important;
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

  .text {
    font-size: 1.2rem;
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;
    margin-right: 1rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
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

        &:hover {
          svg {
            fill: var(--color-success);
          }
        }
      }

      &:hover {
        svg {
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
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

const PortfolioAppWrapper = styled.div`
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

const RadioWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  & > .label {
    margin-top: 0.2rem;
    margin-right: 2rem;
  }
`;

export {
  WalletViewWrapper,
  ChainWrapper,
  OptionWrapper,
  RadioWrapper,
  PortfolioAppWrapper,
};
