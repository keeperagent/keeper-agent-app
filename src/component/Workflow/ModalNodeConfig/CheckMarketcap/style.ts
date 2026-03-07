import styled from "styled-components";

const Wrapper = styled.div`
  .node-provider-option {
    display: flex;
    justify-content: space-between;
    margin-top: var(--margin-top);
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
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

export { Wrapper, ChainWrapper };
