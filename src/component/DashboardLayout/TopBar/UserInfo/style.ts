import styled from "styled-components";

const UserInfoWrapper = styled.div`
  .user {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-right: 1rem;

      .user-position {
        font-size: 0.9rem;
        font-weight: 400;
        color: ${({ theme }) => theme.colorTextSecondary};
      }
    }

    .user-avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid ${({ theme }) => theme.colorBorder};
      border-radius: 50%;
      height: 2.5rem;
      width: 2.5rem;
      opacity: 0.7;

      img {
        border-radius: 50%;
        height: 2.5rem;
        width: 2.5rem;
        object-fit: cover;
        object-position: center;
      }
    }
  }
`;

export { UserInfoWrapper };
