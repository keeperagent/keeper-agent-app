import styled from "styled-components";

const UserInfoWrapper = styled.div`
  .user {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    cursor: pointer;
    padding: 0.45rem 0.9rem 0.45rem 0.5rem;
    border-radius: var(--border-radius);
    border: 1px solid ${({ theme }) => theme.colorBorder};
    background: ${({ theme }) => theme.colorBgSecondary};
    transition: border-color 0.15s ease;

    &:hover {
      border-color: ${({ theme }) => theme.colorBorderHover};
    }
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: #6366f1;
    color: #fff;
    font-size: 1.2rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .user-name {
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colorTextPrimary};
    white-space: nowrap;
  }

  .user-tier {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: 0.4rem;
    border: 1px solid ${({ theme }) => theme.colorBorder};
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colorTextSecondary};
    white-space: nowrap;
  }
`;

export { UserInfoWrapper };
