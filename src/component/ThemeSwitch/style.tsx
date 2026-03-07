import styled from "styled-components";

const ToggleDarkModeWrapper = styled.div`
  transform: scale(0.8);
  &:hover {
    cursor: pointer;
  }

  .night {
    margin: 0 auto;
    font-size: 2px;
    position: relative;
    height: 2.5rem;
    width: 5.5rem;
    border-radius: 3rem;
    transition: all 500ms ease-in-out;
    background: #423966;
  }

  .day {
    background: #ffbf71;
  }

  .moon {
    position: absolute;
    border-radius: 50%;
    transition: all 400ms ease-in-out;
    top: 0.4rem;
    left: 0.7rem;
    transform: rotate(-75deg);
    width: 1.6rem;
    height: 1.6rem;
    box-shadow: 2em 2.5em 0 0em #d9fbff inset,
      rgba(255, 255, 255, 0.3) 0em -5em 0 -3.5em,
      rgba(255, 255, 255, 0.3) 3em 7em 0 -3.3em,
      rgba(255, 255, 255, 0.1) 6em 2em 0 -3em,
      rgba(255, 255, 255, 0.3) 8em 8em 0 -3.3em,
      rgba(255, 255, 255, 0.3) 6em 13em 0 -3.5em,
      rgba(255, 255, 255, 0.1) -4em 7em 0 -3em,
      rgba(255, 255, 255, 0.5) -1em 10em 0 -3em;
  }

  .sun {
    top: 0.5rem;
    left: 3.2rem;
    transform: rotate(0deg) scale(0.8);
    width: 1.4rem;
    height: 1.4rem;
    box-shadow: 3em 3em 0 5em #fff inset, 0 -5em 0 -2.7em #fff,
      3.5em -3.5em 0 -3em #fff, 5em 0 0 -2.7em #fff, 3.5em 3.5em 0 -3em #fff,
      0 5em 0 -2.7em #fff, -3.5em 3.5em 0 -3em #fff, -5em 0 0 -2.7em #fff,
      -3.5em -3.5em 0 -3em #fff;
  }
`;

export { ToggleDarkModeWrapper };
