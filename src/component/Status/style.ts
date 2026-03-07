import styled from "styled-components";

interface StatusWrapperProps {
  isSuccess?: boolean;
  isLarge?: boolean;
}

const StatusWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: ${({ isLarge }) => (isLarge ? "1.2rem" : "1.1rem")};
  background: ${(props: StatusWrapperProps) =>
    props.isSuccess ? "var(--background-success)" : "var(--background-error)"};
  padding: ${({ isLarge }) => (isLarge ? "0.4rem 1.2rem" : "0.2rem 1rem")};
  color: ${(props: StatusWrapperProps) =>
    props.isSuccess ? "var(--color-success)" : "var(--color-error)"};
  border-radius: 1rem;
  font-weight: 500;
  white-space: nowrap;

  .icon {
    margin-right: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;

    & > * {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      margin-top: 0.2rem;
      margin-bottom: 0.2rem;
    }
  }

  .text {
  }

  .link {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.7rem;

    svg {
      width: 1rem;
      height: 1rem;
      min-width: 1rem;
      min-height: 1rem;
    }
  }
`;

export { StatusWrapper };
