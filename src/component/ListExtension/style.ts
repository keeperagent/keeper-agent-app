import styled from "styled-components";

const ListWrapper = styled.div`
  .search {
    margin-bottom: var(--margin-bottom);
    display: flex;
    align-items: center;

    .custom-select {
      margin-right: 1rem;
    }

    .btn {
      font-size: 1.1rem;
    }
  }

  .list {
    margin-top: 2rem;
    margin-bottom: 2rem;
    max-height: 20rem;
    overflow-y: auto;
    padding-right: 0.5rem;

    .item {
      &:not(:last-of-type) {
        margin-bottom: 1rem;
      }
    }
  }

  .empty {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: -2rem;
    margin-top: -2rem;
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

export { ListWrapper, OptionWrapper };
