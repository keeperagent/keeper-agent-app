import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ProfileGroupWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;

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
    }

    .setting-icon {
      transform: scale(1.1);
    }

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      cursor: pointer;
      padding: 0.2rem;
      margin-right: 1rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
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
  ProfileGroupWrapper,
  IconWrapper,
  LinkHoverWrapper,
  ExpandRowWrapper,
  ExpandIconWrapper,
  OptionWrapper,
};
