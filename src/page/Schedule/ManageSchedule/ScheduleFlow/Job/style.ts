import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  padding: 1.5rem 2rem;
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: var(--border-radius);
  position: relative;
  min-height: 12rem;
  min-width: 27rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;

  & > .header {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    align-items: center;

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 1rem;

      .loading-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        animation: spinning 0.8s linear infinite;

        svg {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          min-height: 1.5rem;
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        }
      }
    }

    @keyframes spinning {
      from {
        transform: rotate(0);
      }

      to {
        transform: rotate(360deg);
      }
    }

    .icon {
      cursor: pointer;
      display: flex;
      align-items: center;
      margin-right: 1rem;

      svg {
        width: 1.5rem;
        height: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }

    .delete {
      &:hover {
        svg {
          fill: var(--color-error);
        }
      }
    }

    .order {
      background-color: var(--background-success);
      width: 2rem;
      height: 2rem;
      border-radius: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1rem;
      font-weight: 500;
    }

    .ant-badge-status-dot {
      margin-right: 1rem;
      width: 0.8rem !important;
      height: 0.8rem !important;
    }

    .stop-icon {
      border-radius: 0.3rem;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 0.3rem;
      background-color: var(--color-error);
      margin-right: 1rem;
      cursor: pointer;
    }
  }

  & > .item {
    &:not(:last-of-type) {
      margin-bottom: 0.7rem;
      margin-top: 0.7rem;
    }

    .label {
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .value {
      font-weight: 600;
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      cursor: pointer;

      &:hover {
        color: var(--color-text-hover);
      }
    }

    .prompt-preview {
      cursor: pointer;
      font-weight: 500;
      font-size: 1.2rem;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }
  }
`;

const DurationWrapper = styled.div`
  .item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 1.2rem;
    padding: 0.5rem 1rem;

    .label {
      margin-right: 0.5rem;
      white-space: nowrap;
      display: flex;
      align-items: center;

      .icon {
        border-radius: 0.2rem;
        width: 1rem;
        height: 1rem;
        margin-right: 1rem;
        flex-shrink: 0;
      }
    }

    .value {
      margin-left: 2rem;
      white-space: nowrap;
    }

    &.log-markdown {
      max-width: 40rem;
      max-height: 30rem;
      overflow-y: auto;

      p,
      li,
      ul,
      ol,
      h1,
      h2,
      h3,
      h4 {
        font-size: 1.2rem;
        line-height: 1.6;
        white-space: normal;
      }

      code {
        font-size: 1.1rem;
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTransparent};
        padding: 0.1rem 0.3rem;
        border-radius: 0.3rem;
      }

      pre {
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTransparent};
        padding: 0.8rem;
        border-radius: 0.4rem;
        overflow-x: auto;
      }
    }
  }

  .divider {
    height: 1px;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    margin: 0.3rem 1rem;
  }
`;

const ProviderBadge = styled.div`
  align-items: center;
  cursor: pointer;
  padding: 0.2rem 0.7rem 0.2rem 0.7rem;
  border-radius: 2rem;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  width: fit-content;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--color-primary);
  }

  img {
    width: 1.3rem;
    height: 1.3rem;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.7rem;
  }

  span {
    font-size: 1.1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }
`;

const EditProviderRow = styled.div`
  display: flex;
  gap: 1rem;

  .provider-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 1rem 0.5rem 1rem;
    border-radius: 2rem;
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    cursor: pointer;
    transition: border-color 0.15s;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTransparent};

    &:hover {
      border-color: var(--color-primary);
    }

    &.active {
      border-color: var(--color-primary);
    }

    img {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      object-fit: cover;
    }

    span {
      font-size: 1.2rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

export { Wrapper, DurationWrapper, ProviderBadge, EditProviderRow };
