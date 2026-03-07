import styled from "styled-components";

const Wrapper = styled.div`
  .image {
    img {
      height: 23rem;
    }
  }

  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.5rem;

    svg {
      width: 1.3rem;
      height: 1.3rem;
      min-width: 1.3rem;
      min-height: 1.3rem;
    }
  }
`;

export { Wrapper };
