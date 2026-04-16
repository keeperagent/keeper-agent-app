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
