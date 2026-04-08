import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ManageWalletWrapper = styled.div`
  width: 100%;

  .ant-table-column-has-sorters {
    .ant-table-column-title {
      display: none;
    }

    .ant-table-column-sorter {
      height: 100%;
      display: flex;
      justify-content: center;
      margin: 0;
      flex-basis: 100%;
    }
  }

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;

    /* fix for <PasswordInput /> */
    .ant-form-item {
      margin-bottom: 0 !important;
    }
  }

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 1.7rem;

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

  .custom-select {
    border: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorderSecondary};
  }
`;

const ExpandIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
  width: 100%;
  overflow: hidden;

  svg {
    height: 1.5rem;
    width: 1.5rem;
    min-width: 1.5rem;
    min-height: 1.5rem;
  }
`;

const ExpandRowWrapper = styled.div`
  display: flex;

  .info {
    margin-right: auto;
  }

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

const PortfolioAppWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

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

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    min-width: 1.5rem;
    min-height: 1.5rem;
  }
`;

export {
  ManageWalletWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  PortfolioAppWrapper,
  OptionWrapper,
  IconWrapper,
};
