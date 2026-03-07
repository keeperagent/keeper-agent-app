import styled from "styled-components";

interface BtnProps {
  isLoading?: boolean;
  disabled?: boolean;
  theme?: any;
}

const PrimaryButtonWrapper = styled.button<BtnProps>`
  width: 100%;
  background-color: var(--color-primary);
  border: none;
  padding: 1rem 1.3rem 1rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: 500;
  outline: none;
  border-radius: var(--border-radius);
  opacity: ${(props) => (props.isLoading || props.disabled ? 0.7 : 1)};
  cursor: ${(props) =>
    props.isLoading || props.disabled ? "not-allowed" : "pointer"};
  white-space: nowrap;

  .icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.6rem;
    width: 1rem;
    height: 1rem;

    svg {
      width: 1rem;
      height: 1rem;
      fill: white;
    }
  }

  .text {
    font-size: 1.4rem;
  }

  .loading {
    margin-left: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;

    .loading-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      animation: spinning 0.8s linear infinite;

      svg {
        width: 1.3rem;
        height: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
        fill: white;
      }
    }
  }

  @keyframes spinning {
    from {
      transform: rotate(0);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;

export { PrimaryButtonWrapper };
