import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const UnlockFormWrapper = styled.div`
  position: relative;
  display: flex;
  z-index: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .password-field {
    --c-text: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    --c-text-light: ${({ theme }: { theme: ITheme }) =>
      theme.colorTextSecondary};

    input,
    .ant-input {
      color: ${({ theme }: { theme: ITheme }) =>
        theme.colorTextPrimary} !important;
    }
  }
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
  color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
`;

export const HintText = styled.p`
  font-size: 1rem;
  color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
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
  color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
  text-align: center;

  &:hover {
    color: var(--telegram-color);
  }
`;
