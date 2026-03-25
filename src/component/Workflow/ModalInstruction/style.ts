import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .search {
    width: 40rem;
    margin-bottom: 2rem;
  }

  .main {
    display: flex;
    justify-content: space-between;

    .left {
      flex-basis: 55%;
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      height: 65rem;
      overflow-y: auto;
      padding-right: 1.7rem;

      .group {
        &:not(:last-of-type) {
          margin-bottom: 0.5rem;
        }
        width: 100%;

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
            flex-basis: 33.33%;
            padding: 0 0.7rem;
            cursor: pointer;
          }
        }
      }

      .empty {
        display: flex;
        justify-content: center;
        width: 100%;
        margin-top: 5rem;
      }
    }

    .content-wrapper {
      flex-basis: 43%;
      height: 65rem;
      overflow-y: auto;
      padding-right: 1rem;
    }
  }
`;

export { Wrapper };
