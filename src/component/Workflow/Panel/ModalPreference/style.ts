import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-top: var(--margin-top);

  .help {
    width: 70rem;
    margin-top: var(--margin-top);
  }

  .item {
    margin-bottom: var(--margin-bottom-large);

    & > .label {
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }

    .content {
      display: flex;
      flex-direction: column;
      margin-top: 1rem;

      &.list-node-wrapper {
        height: 65vh;
        overflow-y: auto;
      }

      & > * {
        font-size: 1.3rem;
      }

      .group {
        &:not(:last-of-type) {
          margin-bottom: 0.5rem;
        }

        .label {
          font-size: 1.1rem;
          color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
          margin-bottom: 1.3rem;
          font-weight: 500;
        }

        .list-node {
          display: flex;
          justify-content: flex-start;
          flex-wrap: wrap;

          .node-wrapper {
            flex-basis: 19.5%;
            padding: 0 0.7rem;
          }
        }
      }
    }
  }
`;

const HelpWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.3rem;

  span {
    white-space: nowrap;
  }
`;

export { Wrapper, HelpWrapper };
