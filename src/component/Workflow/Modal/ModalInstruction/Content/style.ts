import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .item {
    margin-bottom: var(--margin-bottom);

    .label {
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: uppercase;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .node-wrapper {
      margin-top: 0.5rem;
      width: 30rem;
    }

    .image {
      margin-top: 0.5rem;

      img {
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
        width: 30rem;
        border-radius: 0.5rem;
      }
    }

    .content {
      margin-top: 0.3rem;
      font-size: 1.4rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

const DescriptionWrapper = styled.div`
  font-size: 1.4rem;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

  .link {
    font-weight: 600;
    color: var(--telegram-color);
    cursor: pointer;
  }

  .example {
    margin-top: 1rem;
    font-size: 1.3rem;
  }
`;

export { Wrapper, DescriptionWrapper };
