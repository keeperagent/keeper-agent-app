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
`;

const OptionWrapper = styled.div`
  display: flex;

  .logo {
    display: flex;
    align-items: center;
    margin-right: 1rem;

    img {
      height: 1.5rem;
      width: 1.5rem;
    }
  }

  .name {
    font-size: 1.2rem;
  }
`;

export { Wrapper, OptionWrapper };
