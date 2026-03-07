import styled from "styled-components";

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;
  margin-top: var(--margin-top);

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .list {
    display: flex;
    width: 100%;
    flex-wrap: wrap;

    .item {
      flex-basis: 33.33%;
      padding: 1rem 1rem;
    }
  }

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    margin-top: -10vh;
  }
`;

export { PageWrapper };
