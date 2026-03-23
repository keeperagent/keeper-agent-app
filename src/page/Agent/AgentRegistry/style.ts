import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 1.6rem;
  height: 100%;
  overflow-y: auto;

  .header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
    gap: 1.6rem;
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 20rem;
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem 2rem;
    color: var(--color-text-secondary);

    &__title {
      font-size: 1.6rem;
      font-weight: 600;
      margin-bottom: 0.8rem;
    }

    &__desc {
      font-size: 1.3rem;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding: 1.6rem 0;
  }
`;
