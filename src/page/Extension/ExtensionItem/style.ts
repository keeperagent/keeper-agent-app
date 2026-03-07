import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ItemWrapper = styled.div`
  width: 100%;
  display: flex;
  border-radius: 5px;
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  background-color: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
  padding: 2rem 1.5rem;
  height: 14rem;

  &:hover {
    border: 1px dashed var(--color-primary);
  }

  .logo {
    height: 4rem;
    width: 4rem;
    margin-right: 1.5rem;

    img {
      height: 4rem;
      width: 4rem;
    }
  }

  .info {
    width: 100%;
    display: flex;
    flex-direction: column;

    .name {
      font-size: 1.3rem;
      font-weight: 500;
      margin-bottom: 0.7rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }

    .description {
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      line-height: 1.7rem;
    }

    .footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      align-items: flex-end;

      .btn-delete {
        display: flex;

        svg {
          width: 1.4rem;
          height: 1.4rem;
          min-width: 1.4rem;
          min-height: 1.4rem;
          cursor: pointer;
        }

        .trash {
          transform: scale(1.1);

          &:hover {
            fill: var(--color-error);
          }
        }
      }

      .btn-open__folder {
        display: flex;
        margin-right: var(--margin-right);

        svg {
          height: 1.4rem;
          width: 1.4rem;
          min-width: 1.4rem;
          min-height: 1.4rem;
        }

        .open-folder {
          transform: scale(1.1);
        }
      }

      .btn-open__folder:hover svg {
        fill: var(--color-primary);
        cursor: pointer;
      }

      .tool {
        display: flex;
        align-items: center;
      }

      .id {
        margin-bottom: 0.5rem;
      }

      .version,
      .id {
        font-size: 1.1rem;
        text-align: end;
        font-weight: 600;
        text-align: left;

        span {
          font-weight: 600;
          font-size: 1rem;
          margin-right: 0.5rem;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        }

        .label {
          width: 50px;
          font-weight: 400;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
        }
      }

      .btn-id {
        font-size: 1rem;
        color: var(--color-white);
        background-color: var(--color-primary);
        padding: 0.5rem;
        margin-right: 1rem;
        border: none;
        border-radius: 5px;

        &:hover {
          cursor: pointer;
        }
      }
    }
  }
`;

export { ItemWrapper };
