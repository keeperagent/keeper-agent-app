import styled from "styled-components";

const Wrapper = styled.div`
  .ant-form-item-label {
    label {
      width: 100%;

      &::after {
        display: none;
      }
    }
  }
`;

const CodeLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .label {
    display: flex;
    align-items: center;

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
  }

  .icon {
    height: 1.5rem;
    width: 1.5rem;
    cursor: pointer;
    margin-left: var(--margin-left);
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      height: 1.5rem;
      width: 1.5rem;
      min-width: 1.5rem;
      min-height: 1.5rem;
    }
  }
`;

export { Wrapper, CodeLabelWrapper };
