import styled from "styled-components";

const Wrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: var(--border-radius);
  background-color: rgb(20, 20, 20);

  img {
    width: 1.7rem;
    height: 1.7rem;
    margin-right: 1rem;
  }

  .text {
    font-size: 1.3rem;
    color: var(--color-white);
  }
`;

export { Wrapper };
