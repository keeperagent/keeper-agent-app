import styled from "styled-components";
import { ITheme } from "@/style/theme";
import { sidebarWidth, collapsedSidebarWidth } from "../style";

const TopBarWrapper = styled.div`
  max-width: 100vw;
  padding: 1.1rem 3rem;
  font-size: 1.5rem;
  border-bottom: 1px solid
    ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  display: flex;
  justify-content: space-between;
  margin-left: ${(props: any) =>
    props.isSidebarOpen ? sidebarWidth : collapsedSidebarWidth};
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  width: ${(props: any) =>
    props.isSidebarOpen
      ? `calc(100%-${sidebarWidth})`
      : `calc(100%-${collapsedSidebarWidth})`};
  z-index: 3;
  background-color: ${({ theme }: { theme: ITheme }) => theme.colorBgSecondary};

  &.fullscreen {
    margin-left: 0;
  }

  .page-detail {
    display: flex;
    justify-content: center;
    align-items: center;
    display: flex;

    .heading {
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      font-weight: 700;
      font-size: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
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

      .list-info {
        display: flex;

        .campaign-info {
          margin-left: var(--margin-left);
          display: flex;
          flex-direction: column;
          background-color: ${({ theme }: { theme: ITheme }) =>
            theme?.colorBorder};
          padding: 0.7rem 1.5rem;
          border-radius: var(--border-radius);

          .label {
            margin-right: 0.5rem;
            font-size: 0.8rem;
            margin-bottom: 0.3rem;
            color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          }

          .value {
            font-weight: 600;
            font-size: 1rem;
            color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
          }
        }
      }
    }
  }

  .setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-left: auto;
    position: relative;

    & > * {
      margin-left: var(--margin-left-small);
    }
  }
`;

export { TopBarWrapper };
