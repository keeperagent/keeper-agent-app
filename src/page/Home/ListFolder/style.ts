import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  border: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  border-radius: var(--border-radius);
  padding: var(--padding);
  margin-bottom: var(--margin-bottom-large);
  display: flex;
  flex-direction: column;
  height: 100%;

  .heading {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: var(--margin-bottom);

    .color {
      width: 1.3rem;
      height: 1.3rem;
      margin-right: 0.7rem;
      border-radius: 2px;
    }

    .title {
      font-size: 1.6rem;
      font-weight: 700;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }

    .folder-statistic {
      margin-left: var(--margin-left);
      display: flex;
      align-items: center;

      .value {
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        margin-left: 0.5rem;
        font-weight: 500;
        font-size: 1.2rem;

        display: flex;
        align-items: center;

        .unit {
          margin-left: 0.3rem;
        }
      }
    }

    .more {
      font-size: 1.2rem;
      color: var(--color-primary);
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      margin-left: auto;

      &:hover {
        color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      }

      .icon {
        margin-left: 0.3rem;
        display: flex;
        justify-content: center;
        align-items: center;

        svg {
          width: 0.8rem;
          height: 0.8rem;
          min-width: 0.8rem;
          min-height: 0.8rem;
        }
      }
    }
  }

  .list-folder {
    display: flex;
    flex-wrap: wrap;

    .item {
      padding: 0.5rem 0.5rem;
    }
  }

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }
`;

export { Wrapper };
