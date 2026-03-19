import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;
  margin-top: var(--margin-top);

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

    .setting-icon {
      transform: scale(1.1);
    }

    & > * {
      margin-left: 1rem;
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

  .ant-badge-status-dot {
    width: 0.8rem !important;
    height: 0.8rem !important;
  }
`;

const IconHighlightWrapper = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius);
  cursor: pointer;

  &.disable {
    cursor: not-allowed;
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};

    & svg {
      cursor: not-allowed;
    }
  }

  &.calculator {
    margin-left: var(--margin-left);
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgInput};
    border-radius: 3px;
    padding: 0.4rem 0.5rem;

    svg {
      width: 2rem;
      height: 2rem;
      min-width: 2rem;
      min-height: 2rem;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }

  &:hover {
    svg {
      fill: var(--color-text-hover);
    }
  }

  & > * {
    transform: scale(0.95);
  }
`;

const ExpandRowWrapper = styled.div`
  display: flex;
  justify-content: flex-end;

  .info {
    margin-right: auto;
    width: 100%;

    .item {
      &:not(:last-of-type) {
        margin-bottom: var(--margin-bottom);
      }

      & > .label {
        margin-bottom: 0.7rem;
      }
    }

    .script {
      &:not(:last-of-type) {
        margin-bottom: 1.7rem !important;
      }

      .detail {
        flex-basis: 35%;
      }

      .run-time {
        flex-basis: 15%;

        .label {
        }

        .value {
        }
      }
    }
  }

  .date {
    flex-basis: 25%;

    & > .item {
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
    display: flex;
    flex-direction: column;
    width: 100%;

    &:not(:last-of-type) {
      margin-bottom: var(--margin-bottom);
    }

    .label {
      font-weight: 600;
      font-size: 1.2rem;
      margin-bottom: 0.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .value {
      display: flex;
      align-items: flex-start;
      font-size: 1.2rem;
      width: 100%;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

      &:not(:last-of-type) {
        margin-bottom: 0.7rem;
      }

      & > span {
        margin-left: 0.7rem;
      }

      .count {
        margin-right: 0.5rem;
        font-size: 1rem;
      }

      svg {
        width: 1.3rem;
        height: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
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
    width: 1.5rem;
    min-width: 2rem;
    min-height: 1.5rem;
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  cursor: pointer;

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

  .ant-badge-status-dot {
    width: 0.8rem !important;
    height: 0.8rem !important;
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
export {
  PageWrapper,
  IconHighlightWrapper,
  ExpandRowWrapper,
  ExpandIconWrapper,
  OptionWrapper,
  IconWrapper,
  LinkHoverWrapper,
};
