import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ModalWrapper = styled.div`
  .chart {
    margin-bottom: 2rem;
    border: 1px dashed ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    padding: 0.5rem;
    border-radius: 5px;
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme.colorBgSecondary};
  }

  .slider {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 3rem;

    .statistic {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .item {
        &:not(:last-of-type) {
          margin-bottom: var(--margin-bottom);
        }

        .label {
          font-size: 1.3rem;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        }

        .option {
          margin-bottom: 0.5rem;
          margin-top: 0.3rem;

          .tag {
            font-size: 0.8rem;
            line-height: 1.6rem;
            cursor: pointer;
            background-color: ${({ theme }: { theme: ITheme }) =>
              theme.colorBorder};
            border: 1px solid transparent;
            margin-right: 0.7rem;

            &.active {
              border: 1px solid var(--color-primary);
            }
          }
        }

        .value {
          font-size: 1.9rem;
          font-weight: 700;
          color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
        }
      }
    }
  }
`;

export { ModalWrapper };
