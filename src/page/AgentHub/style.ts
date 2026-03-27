import styled from "styled-components";

export const ChatRegistryPage = styled.div`
  position: absolute;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  inset: 0;
`;

export const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-size: 1.6rem;
  overflow-y: auto;

  .tab {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: var(--margin-bottom);

    .header-search {
      width: 32rem;
      max-width: 100%;
      flex-shrink: 0;
    }

    .header-add-btn {
      flex-shrink: 0;
    }
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;

    & > * {
      flex: 0 0 calc((100% - 4rem) / 3);
    }
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
      margin-bottom: 2rem;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding: 1.6rem 0;
  }
`;
