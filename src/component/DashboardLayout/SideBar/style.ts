import styled from "styled-components";
import { ITheme } from "@/style/theme";

const SidebarWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  background-color: ${({ theme }: { theme: ITheme }) => theme.colorBgPrimary};
  height: 100vh;
  width: 24rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  z-index: 1;
  box-sizing: border-box;
  z-index: 2;
  border-right: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};

  & a {
    text-decoration: none;
  }

  .utils {
    display: flex;
    align-self: center;
    margin-bottom: var(--margin-bottom);

    .global-search {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        cursor: pointer;
        width: 100%;
        height: 100%;
      }

      &:hover {
        .search-icon svg {
          animation: shake 0.3s ease-in-out;
        }
      }
    }

    .search-icon {
      background-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgTransparent};
      border-radius: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;

      svg {
        width: 2rem;
        height: 1.8rem;
        min-width: 2rem;
        min-height: 1.8rem;
        fill: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      }
    }
  }

  .toggle {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    border-top: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    cursor: pointer;

    .icon {
      width: 1.3rem;
      height: 1.3rem;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        width: 1.3rem;
        height: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
        fill: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      }
    }

    .version {
      font-size: 1rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      margin-left: 1rem;
    }
  }

  &.close {
    width: 7rem;

    .version {
      display: none;
    }

    .logo-wrapper {
      width: 100%;

      .logo {
        margin-right: 0;
        height: 3rem;
        width: 3rem;
      }

      .text {
        display: none;
      }
    }
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;

    .logo {
      height: 4rem;
      width: 4rem;
    }

    .text {
      margin-left: 0.5rem;
      display: flex;
      flex-direction: column;
      text-transform: uppercase;
      font-weight: 700;
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
      letter-spacing: 2px;
    }
  }

  &.close {
    .menu-item-wrapper {
      .menu-item {
        margin: 0 1rem;

        &__icon {
          height: 2.3rem;
          width: 2.3rem;

          & svg {
            height: 1.5rem;
            width: 1.5rem;
            min-width: 1.5rem;
            min-height: 1.5rem;
          }
        }
      }

      &.active {
        padding: 0 1rem;

        .menu-item {
          margin: 0 1rem;
        }
      }
    }
  }

  .menu {
    height: 100%;
    padding: 0;
    margin: 0;
    overflow: visible;
    overflow-y: auto;
    padding: 0 1.7rem;
    list-style: none;
  }

  &.close {
    .menu {
      padding: 0;

      .menu-item-wrapper {
        &.active {
          .sub-menu-item {
            padding: 0;
          }
        }

        .menu-item {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0;

          &__icon {
            margin-right: 0;
          }

          &__label {
            display: none;
          }

          &__notification {
            display: none;
          }
        }
      }

      .sub-menu-item {
        .icon-wrapper {
          display: none;
        }
      }

      .sub-menu {
        position: absolute;
        left: 100%;
        top: -10px;
        margin-top: 0;
        padding: 1rem 3rem 1rem 2rem;
        border-radius: 0 3px 3px 0;
        opacity: 0;
        pointer-events: none;
        background-color: ${({ theme }: { theme: ITheme }) =>
          theme.colorBgSecondary};
        box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;

        li {
          padding: 0.7rem 0.2rem;
        }

        &__name {
          display: block;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          opacity: 1;
          color: ${({ theme }: { theme: ITheme }) =>
            theme.menuLabelActiveColor} !important;

          @media only screen and (max-width: 550px) {
            font-size: 1.4rem !important;
          }

          &.category,
          &.category:hover {
            cursor: default;
          }

          &.category {
            position: relative;

            &::after {
              position: absolute;
              content: "";
              bottom: 1px;
              left: 0;
              width: 20%;
              background-color: var(--color-primary);
              height: 2px;
            }
          }
        }
      }

      /* show sub menu when hover */
      .menu-item-wrapper:hover {
        .sub-menu {
          top: 0;
          opacity: 1;
          pointer-events: auto;
        }
      }
    }
  }
`;

interface MenuItemProps {
  isLightMode?: boolean;
  isSidebarOpen?: boolean;
}

const MenuItemWrapper = styled.li`
  position: relative;
  list-style: none;
  width: 100%;
  margin-bottom: ${({ isSidebarOpen }: MenuItemProps) =>
    isSidebarOpen ? "0.4rem" : "0.6rem"};
  transition: all 0.3s ease-in-out;

  &.active {
    .menu-item {
      background: ${({ theme }: { theme: ITheme }) => theme.menuBgActive};

      &:hover {
        .menu-item__label {
          color: ${({ theme }: { theme: ITheme }) =>
            theme.menuLabelActiveColor};
        }
      }

      &__label {
        color: ${({ theme }: { theme: ITheme }) => theme.menuLabelActiveColor};
        font-weight: 600;
      }

      &__icon {
        & svg {
          fill: ${({ theme }: { theme: ITheme }) => theme.menuLabelActiveColor};
        }
      }
    }

    .sub-menu-item {
      background: var(--color-bg-primary);

      /* only get the background color of the parent, not the background color of the child */
      .menu-item {
        background: transparent;

        &__icon {
          & * {
            stroke: var(--color-primary);
          }
        }
      }
    }
  }

  &:hover {
    cursor: pointer;

    .sub-menu {
      border: 1px solid
        ${(props) => (props.isLightMode ? "transparent" : "var(--color-gray)")};

      &.blank {
        top: 50% !important;
        transform: translateY(-50%);
        opacity: 1;
        pointer-events: auto;

        .sub-menu__name {
          &:hover {
            color: ${({ theme }: { theme: ITheme }) =>
              theme.colorPrimaryLight} !important;
          }
        }
      }
    }
  }

  .menu-item.single {
    padding: 0.7rem 1rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    border-radius: 1rem;

    &:hover {
      .menu-item__icon {
        animation: shake 0.3s;
      }

      .menu-item__label {
        color: ${({ theme }: { theme: ITheme }) => theme.colorPrimary};
      }
    }

    &__icon {
      height: 2.5rem;
      width: 2.5rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      font-size: ${({ isSidebarOpen }: MenuItemProps) =>
        isSidebarOpen ? "1.5rem" : "1.7rem"};
      margin-right: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${({ isSidebarOpen }) => (isSidebarOpen ? "0.8rem" : "0.7rem")};
      border-radius: 3px;
      transition: all 0.3s ease-in-out;

      & svg {
        height: 1.7rem;
        width: 1.7rem;
        min-width: 1.7rem;
        min-height: 1.7rem;
      }
    }

    &__label {
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      font-size: 1.3rem;
      font-weight: 500;
    }
  }

  .sub-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 0.5rem;
    padding: 0 1rem;

    .icon-wrapper {
      width: 2rem;
      height: 2rem;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  &.show-menu {
    .sub-menu {
      display: flex;
      flex-direction: column;
      border: 1px solid transparent;
    }

    .sub-menu-item {
      .icon {
        transform: rotate(-180deg);
      }
    }
  }

  .sub-menu {
    padding: 6px 6px 0 2.5rem;
    margin-top: -0.5rem;
    display: none;
    list-style: none;

    &.blank {
      opacity: 0;
      pointer-events: none;
      padding: 3px 2rem 0.6rem 1.5rem;
    }

    & > li {
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      font-size: 1.2rem;
      white-space: nowrap;
      font-weight: 500;
      display: flex;
      padding: 1rem 0;
      margin-left: 1.5rem;

      &:hover {
        color: ${({ theme }: { theme: ITheme }) => theme.colorPrimary};
      }
    }

    &__name {
      display: none;
    }
  }
`;

export { SidebarWrapper, MenuItemWrapper };
