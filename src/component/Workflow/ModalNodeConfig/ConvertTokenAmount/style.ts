import styled from "styled-components";

const Wrapper = styled.div`
  .token-mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
    }
  }

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
