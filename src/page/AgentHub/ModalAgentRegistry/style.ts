import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const ChainWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;

  img {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  span {
    font-size: 1.2rem;
  }
`;

export const OptionWrapper = styled.div`

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-size: 1.1rem;
    font-weight: 300;
  }
`;
