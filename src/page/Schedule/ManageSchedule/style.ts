import { ITheme } from "@/style/theme";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;

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

    .view-icon {
      display: flex;
      justify-content: center;
      align-items: center;
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

const ScheduleNameWrapper = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;

  &:hover {
    .name {
      color: var(--color-text-hover);
      font-weight: 500;
    }
  }

  .note {
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .ant-badge-status-dot {
    width: 0.8rem !important;
    height: 0.8rem !important;
  }
`;

const ExpandRowWrapper = styled.div`
  display: flex;
  flex-direction: column;

  .date {
    display: flex;
    margin-bottom: var(--margin-bottom);

    .item {
      margin-right: 3rem;

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
  }
`;

export {
  Wrapper,
  ExpandIconWrapper,
  IconWrapper,
  ScheduleNameWrapper,
  ExpandRowWrapper,
};
