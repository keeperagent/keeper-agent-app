import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PresetItemWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 0.7rem;
  border-radius: var(--border-radius);
  font-size: 1.2rem;
  border-bottom: 1px solid
    ${({ theme }: { theme: ITheme }) => theme?.colorBorder};

  .preset-item-info {
    flex: 1;
    overflow: hidden;
    cursor: pointer;

    &:hover {
      .preset-item-name {
        color: var(--color-text-hover);
      }

      .preset-item-detail {
        & > span {
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          transition: all 0.1s ease-in-out;
        }
      }
    }

    .preset-item-name {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 0.7rem;
      transition: all 0.1s ease-in-out;
    }

    .preset-item-detail {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.4rem;

      & > span {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        font-size: 1rem;
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTransparentLight};
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBgTransparent};
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }

  .preset-item-actions {
    display: flex;
    gap: 1.3rem;
    margin-left: 0.8rem;
    font-size: 1.1rem;
    flex-shrink: 0;

    & > span {
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .preset-action-delete {
      color: var(--color-error);
    }
  }
`;

export { PresetItemWrapper };
