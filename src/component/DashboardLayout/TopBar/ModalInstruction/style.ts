import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-top: var(--margin-top);
  font-size: 1.4rem;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

  .image {
    display: flex;
    justify-content: center;
    margin-top: var(--margin-top);
    margin-bottom: var(--margin-bottom);

    img {
      height: 30rem;
    }
  }

  .list {
    font-size: 1.3rem;
  }

  .bold {
    font-weight: 500;
  }

  .italic {
    font-style: italic;
  }

  .highlight-text {
    color: var(--color-primary);
  }
`;

export { Wrapper };
