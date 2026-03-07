import styled from "styled-components";

const SpoilerTextWrapper = styled.div`
  padding: 0 3px;

  .spoiler {
    user-select: none;
    margin-right: 3px;
    background-size: auto min(150%, 1.6rem);
    border-radius: 0.5rem;
    animation: pulse-opacity-light 1.75s linear infinite;

    .content {
      user-select: none;
      opacity: 0;
      transition: opacity 250ms ease;
    }
  }

  @keyframes pulse-opacity-light {
    25% {
      opacity: 1;
    }

    50% {
      opacity: 0.3;
    }

    75% {
      opacity: 1;
    }
  }
`;

export { SpoilerTextWrapper };
