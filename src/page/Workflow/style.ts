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
    height: 1.7rem;

    svg {
      width: 1.9rem;
      height: 1.9rem;
      min-width: 1.9rem;
      min-height: 1.9rem;
      cursor: pointer;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }
`;

const IconHighlightWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: var(--margin-right);
  padding: 0.3rem 0.5rem;
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius);
  cursor: pointer;

  & > * {
    transform: scale(0.8);
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

export {
  PageWrapper,
  IconHighlightWrapper,
  LinkHoverWrapper,
  OptionWrapper,
  ExpandRowWrapper,
  ExpandIconWrapper,
};
