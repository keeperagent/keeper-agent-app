import styled from "styled-components";

const Wrapper = styled.div`
  .help {
    margin-bottom: var(--margin-bottom);
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
    margin-left: -0.5rem;

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
