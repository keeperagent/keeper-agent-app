import styled from "styled-components";

const LoginFormWrapper = styled.div`
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

  .language {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .heading {
    margin-bottom: 2rem;
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 600;
    font-size: 2.5rem;
    color: white;
  }

  .ant-input {
    color: var(--color-white);

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  .form {
    width: 100%;

    .oauth-signin {
      width: 100%;

      .label {
        display: flex;
        justify-content: center;
        color: white;
        margin: 1rem 0;
        font-size: 1.5rem;
        position: relative;

        &::after,
        &::before {
          content: "";
          position: absolute;
          height: 1px;
          width: 100%;
          top: 50%;
          background-color: var(--color-gray);
        }

        &::after {
          right: 0;
          width: 40%;
        }

        &::before {
          left: 0;
          width: 40%;
        }
      }
    }
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

  .footer {
    margin-top: var(--margin-top);
    font-size: 1.4rem;
    display: flex;
    justify-content: space-between;
    width: 100%;

    .forget-password,
    .sign-up {
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      color: var(--color-text-white);
      text-decoration: none;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .forget-password:hover,
    .sign-up:hover {
      color: white;
      color: var(--color-primary-light);
    }
  }

  label {
    font-weight: 500;
  }
`;

export { LoginFormWrapper };
