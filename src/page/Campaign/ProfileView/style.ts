import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  margin-top: var(--margin-bottom-large);

  .heading {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .back {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-right: var(--margin-right);

      &:hover {
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

        .icon {
          svg {
            fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          }
        }
      }

      .icon {
        height: 2rem;
        width: 2rem;
        margin-right: 0.5rem;

        svg {
          height: 2rem;
          width: 2rem;
          min-width: 2rem;
          min-height: 2rem;
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        }
      }

      .text {
        font-size: 1.3rem;
        font-weight: 500;
      }
    }

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
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      .label {
      }

      .value {
        display: inline;
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

const OpenBrowserWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.4rem 1rem;
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
    border-radius: 3px;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
      border: 1px solid var(--color-primary);
    }

    .text {
      font-size: 1rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    img {
      margin-left: 1rem;
      width: 1.5rem;
      height: 1.5rem;
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
    align-items: center;
    display: flex;

    .edit {
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      margin-right: 1rem;

      svg {
        width: 1.3rem;
        height: 1.3rem;
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

const CloseButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .spining {
    margin-right: 1rem;
    position: absolute;
    left: 3%;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const CloseIconWrapper = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  svg {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    min-height: 2rem;
  }
`;

const StatisticWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: var(--margin-top);

  .toggle {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-primary);
    border-bottom: 0.1px dashed var(--color-primary);
    margin-right: 2rem;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;

    .question-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 1rem;
      cursor: pointer;
    }
  }

  .list-item {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: var(--margin-right-small);

    .stats-info {
      display: flex;
      flex-direction: column;
      background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
      padding: 0.7rem 1.5rem;
      border-radius: var(--border-radius);
      width: auto;

      .label {
        margin-right: 0.5rem;
        font-size: 1.1rem;
        margin-bottom: 0.3rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        white-space: nowrap;
      }

      .value {
        font-weight: 600;
        font-size: 1.1rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        white-space: nowrap;
      }
    }
  }

  .question-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 1rem;
    cursor: pointer;

    svg {
      width: 1.5rem;
      height: 1.5rem;
      min-width: 1.5rem;
      min-height: 1.5rem;
      fill: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
    }
  }

  .setting {
    margin-left: var(--margin-left);
    cursor: pointer;

    svg {
      width: 2.3rem;
      height: 2.3rem;
      min-width: 2.3rem;
      min-height: 2.3rem;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }

  .calculator {
    margin-left: var(--margin-left);
    cursor: pointer;
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

    &:hover {
      svg {
        fill: var(--color-text-hover);
      }
    }
  }
`;

export {
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  OpenBrowserWrapper,
  ProfileNameWrapper,
  PortfolioAppWrapper,
  IconWrapper,
  CloseButtonWrapper,
  CloseIconWrapper,
  StatisticWrapper,
};
