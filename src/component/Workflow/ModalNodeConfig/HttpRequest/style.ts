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

  .question-icon {
    height: 1.5rem;
    width: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.7rem;

    svg {
      height: 1.5rem;
      width: 1.5rem;
      min-width: 1.5rem;
      min-height: 1.5rem;
    }
  }
`;

export { Wrapper };
