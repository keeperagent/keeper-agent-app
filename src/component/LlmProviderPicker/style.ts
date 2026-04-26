import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ProviderRow = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

export const ProviderItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem 0.4rem 0.5rem;
  border-radius: 2rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTransparent};

  &:hover {
    border-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }

  &.active {
    border-color: var(--color-primary);
  }

  &.disabled {
    opacity: 0.35;
    cursor: not-allowed;

    &:hover {
      border-color: transparent;
    }
  }

  img {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }
`;
