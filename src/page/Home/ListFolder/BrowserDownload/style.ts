import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 0.5rem;
  margin-bottom: 0.5rem;

  .title {
    font-size: 1.1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    margin-bottom: 1rem;
  }

  .list-version {
    display: flex;
    margin-bottom: var(--margin-bottom);

    .version {
      flex-basis: 50%;
      display: flex;
      flex-direction: column;

      .label {
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        font-size: 1.3rem;
        margin-bottom: 2rem;
        background-color: ${({ theme }: { theme: ITheme }) =>
          theme.colorBorder};
        padding: 0.7rem 0;
        text-align: center;
      }

      .value {
        font-size: 1.4rem;
        font-weight: 600;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;

        .ant-btn-sm {
          font-size: 0.9rem !important;
        }

        .refresh {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          margin-left: 1rem;
          svg {
            width: 1.5rem;
            height: 1.5rem;
            min-width: 1.5rem;
            min-height: 1.5rem;
            transition: all 0.2s ease-in-out;
            &:hover {
              transform: rotate(-45deg);
            }
          }
        }
      }
    }
  }

  .collapse {
    .ant-collapse-header {
      padding: 0.2rem 0;
      font-size: 1.1rem;
      display: flex;
      align-items: center;

      .ant-collapse-arrow {
        font-size: 1rem;
      }
    }

    .ant-collapse-content-box {
      padding-block: 0 !important;
      padding: 0 !important;
    }
  }

  .advanced {
    display: flex;
    margin: 0.5rem 0;

    .ant-btn {
      font-size: 1rem !important;
    }
  }
`;

export { Wrapper };
