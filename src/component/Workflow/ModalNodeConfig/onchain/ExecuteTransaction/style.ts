import styled from "styled-components";

const Wrapper = styled.div`
  .collapse {
    margin-bottom: 0.5rem;
    margin-top: -0.7rem;
    margin-left: -0.3rem;

    .ant-collapse-header {
      padding: 0.5rem 0;
      font-size: 1.3rem;
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

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;
    margin-right: 1rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .content {
    display: flex;
    flex-direction: column;

    .name {
      font-size: 1.3rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      transition: all 0.1s ease-in-out;
    }

    .description {
      font-size: 1rem;
      font-weight: 400;
    }
  }
`;

const ChainWrapper = styled.div`
  display: flex;
  align-items: center;

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .text {
    font-size: 1.2rem;
  }
`;

export { Wrapper, OptionWrapper, ChainWrapper };
