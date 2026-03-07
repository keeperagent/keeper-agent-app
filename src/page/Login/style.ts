import styled from "styled-components";

const LoginPageWrapper = styled.div`
  min-height: 100vh;
  padding: 4rem;
  width: 100%;
  overflow: hidden;
  font-size: 1.6rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  position: relative;
  overflow-y: auto;

  .main {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    .background-1 {
      position: absolute;
      width: 0.001px;
      height: 10rem;
      transform: rotateZ(25deg);
      background-color: transparent;
      box-shadow: 0px 0px 20rem 10rem rgba(79, 70, 229, 0.4);
      z-index: 0;
      left: -2rem;
    }

    .background-2 {
      position: absolute;
      width: 0.001px;
      height: 15rem;
      transform: rotateZ(10deg);
      background-color: transparent;
      box-shadow: 0px 0px 20rem 10rem rgba(237, 83, 224, 0.2);
      z-index: 0;
      right: -2rem;
      top: 2rem;
    }
  }

  .background-3 {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-image: url("../../asset/dot-bg-1.png");
    background-size: contain;
  }
`;

export { LoginPageWrapper };
