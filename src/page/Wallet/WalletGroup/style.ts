import styled from "styled-components";
import { ITheme } from "@/style/theme";

const WalletGroupWrapper = styled.div`
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

const PortfolioAppWrapper = styled.div`
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

  .disabled-icon {
    width: 1.3rem;
    height: 1.3rem;
    margin-left: 0.7rem;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      width: 1.3rem;
      height: 1.3rem;
      min-width: 1.3rem;
      min-height: 1.3rem;
    }
  }
`;

const ExpandIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
  width: 1.5rem;
  overflow: hidden;

  svg {
    height: 2rem;
    width: 2rem;
    min-width: 2rem;
    min-height: 2rem;
  }
`;

const ExpandRowWrapper = styled.div`
  display: flex;
  justify-content: flex-end;

  .date {
    .item {
      .label {
        text-align: right;
      }

      .value {
        display: inline;
        text-align: right;
      }
    }
  }

  .item {
    &:not(:last-of-type) {
      margin-bottom: 0.9rem;
    }

    .label {
      font-weight: 600;
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .value {
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
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

const OptionWrapper = styled.div`
  padding-bottom: 0.1rem;
  cursor: pointer;
  min-width: 15rem;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }

  .description {
    font-size: 1.1rem;
    font-weight: 400;
    margin-left: 1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }
`;

export {
  WalletGroupWrapper,
  PortfolioAppWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  LinkHoverWrapper,
  OptionWrapper,
};
