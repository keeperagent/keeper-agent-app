import styled from "styled-components";

const Wrapper = styled.div`
  .ant-form-item-label {
    label {
      width: 100% !important;

      &::after {
        display: none;
      }
    }
  }
`;

export { Wrapper };
