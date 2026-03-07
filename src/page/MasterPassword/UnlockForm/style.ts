import styled from "styled-components";

export const UnlockFormWrapper = styled.div`
  position: relative;
  display: flex;
  z-index: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;

  .avatar {
    width: 7rem;
    height: 7rem;
    margin-bottom: 2rem;
  }
`;

export const UserName = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-white);
`;

export const HintText = styled.p`
  font-size: 1rem;
  color: var(--color-text-secondary);
  text-align: center;
  margin-top: 0.5rem;
`;

export const UnlockButtonWrapper = styled.div`
  margin-bottom: 1rem;
`;

export const ResetLink = styled.div`
  font-size: 1rem;
  cursor: pointer;
  text-decoration: underline;
  color: var(--color-text-primary);
  text-align: center;

  &:hover {
    color: var(--telegram-color);
  }
`;
