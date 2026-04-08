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

      &:hover {
        fill: var(--color-text);
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
  justify-content: flex-end;

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

const ProfileNameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .name {
  }

  .icon {
    margin-left: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    svg {
      width: 1.1rem;
      height: 1.1rem;
      min-width: 1.1rem;
      min-height: 1.1rem;
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
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  ProfileNameWrapper,
  OptionWrapper,
  IconWrapper,
};
