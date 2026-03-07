import styled from "styled-components";

const Wrapper = styled.div`
  height: 100vh;
  padding: 4rem;
  width: 100%;
  overflow: hidden;
  font-size: 1.6rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  position: relative;

  .main {
    position: relative;
    width: 60%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;

    .message {
      font-size: 5rem;
      font-weight: 700;
      margin-bottom: 2rem;
      white-space: nowrap;
      color: var(--color-text-white);

      @media only screen and (max-width: 1000px) {
        font-size: 4rem;
      }

      @media only screen and (max-width: 550px) {
        font-size: 3rem;
      }

      @media only screen and (max-width: 400px) {
        font-size: 2.5rem;
      }
    }

    .background {
      position: absolute;
      content: "";
      width: 1px;
      height: 1px;
      border-radius: 50%;
      background-color: transparent;
      box-shadow: 0px 0px 40rem 30rem rgba(79, 70, 229, 0.07);
      z-index: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      @media only screen and (min-width: 1500px) {
        box-shadow: 0px 0px 70rem 45rem rgba(79, 70, 229, 0.07);
      }
    }
  }

  .background-3 {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    img {
      width: 100%;
      height: 100%;
    }
  }
`;

export { Wrapper };
