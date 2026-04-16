import styled from "styled-components";

const Wrapper = styled.div`
  .mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 47%;
    }
  }

  .item {
    display: flex;
    width: 100%;

    &:not(:last-of-type) {
      margin-bottom: 0.5rem;
    }

    .icon {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin-top: 0.6rem;
      margin-left: 1.5rem;
      cursor: pointer;

      &:hover {
        svg {
          fill: var(--color-primary);
        }
      }

      svg {
        width: 2rem;
        height: 2rem;
        min-width: 2rem;
        min-height: 2rem;
      }
    }
  }

  .plus {
    align-self: center;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.5rem;
    cursor: pointer;

    &:hover {
      svg {
        fill: var(--color-primary);
      }
    }

    svg {
      width: 2.3rem;
      height: 2.3rem;
      min-width: 2.3rem;
      min-height: 2.3rem;
    }
  }

  .collapse {
    .ant-collapse-header {
      padding: 0.5rem 0;
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

    .ant-collapse-header-text {
      margin-left: -0.5rem;
    }
  }
`;

const HelpWrapper = styled.div`
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: start;

  .title {
    font-weight: 500;
  }

  .description {
    margin-top: 0.3rem;
    display: flex;
    align-items: center;

    .content {
      color: var(--color-error);
      font-weight: 500;
      background-color: var(--color-border);
      padding: 0.3rem 1rem;
      border-radius: 0.3rem;
      font-size: 1rem;
    }

    .icon {
      height: 1.1rem;
      width: 1.1rem;
      margin-left: 1rem;
      cursor: pointer;

      svg {
        height: 1.1rem;
        width: 1.1rem;
        min-width: 1.1rem;
        min-height: 1.1rem;
      }
    }
  }
`;

export { Wrapper, HelpWrapper };
