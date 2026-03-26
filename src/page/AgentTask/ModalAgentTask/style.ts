import styled from "styled-components";
import { ITheme } from "@/style/theme";

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


