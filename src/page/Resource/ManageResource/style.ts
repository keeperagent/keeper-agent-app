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

    /* fix for <PasswordInput /> */
    .ant-form-item {
      margin-bottom: 0 !important;
    }

    .custom-select {
      border: 1px solid
        ${({ theme }: { theme: ITheme }) => theme?.colorBorderSecondary};
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

const ModalWrapper = styled.div`
  .encript {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
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

export {
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  ModalWrapper,
  OptionWrapper,
};
