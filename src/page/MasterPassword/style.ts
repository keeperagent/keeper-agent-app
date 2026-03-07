import styled from "styled-components";

const MasterPasswordPageWrapper = styled.div`
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

const MasterPasswordFormWrapper = styled.div`
  padding: var(--padding);
  padding-bottom: 5rem;
  box-shadow: var(--box-shadow);
  width: 43rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: radial-gradient(
    ellipse at top right,
    rgba(79, 70, 229, 0.15) 0%,
    rgba(48, 48, 48, 0.3) 100%
  );
  border-radius: var(--border-radius);

  .heading {
    margin-bottom: 1rem;
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 600;
    font-size: 2.5rem;
    color: white;
  }

  .sub-heading {
    margin-bottom: 2rem;
    text-align: center;
    font-size: 1.3rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .ant-input {
    color: var(--white);

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  .form {
    width: 100%;
  }

  .ant-form-item-label {
    label {
      color: white !important;
    }
  }

  .password {
    .ant-form-item {
      margin-bottom: 0;
    }
  }

  label {
    font-weight: 500;
  }
`;

export { MasterPasswordPageWrapper, MasterPasswordFormWrapper };
