import styled from "styled-components";

const MenuWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;

  // overwrite default style of @szhsin/react-menu
  .szh-menu {
    background-color: var(--color-white);
    border-radius: 0.8rem;

    .szh-menu__item {
      color: white;
      font-size: 1.2rem;
      padding: 0.7rem 1.5rem;
    }

    .szh-menu__item--hover {
      background-color: var(--color-border);
    }
  }
`;

const MenuItemWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  padding-right: 3rem;

  &.disable {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .icon {
    display: flex;
    align-items: center;
    margin-right: 1rem;

    svg {
      width: 1.5rem;
      height: 1.5rem;
      min-width: 1.5rem;
      min-height: 1.5rem;
    }
  }

  .label {
    flex-basis: 1;
    margin-right: auto;
    color: var(--color-text);
    font-weight: 500;
    font-size: 1.3rem;
  }
`;

export { MenuWrapper, MenuItemWrapper };
