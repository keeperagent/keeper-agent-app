import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  padding: 1.5rem 2rem;
  border-radius: var(--border-radius);
  flex-basis: 48%;
  background-color: ${({ theme }: { theme: ITheme }) =>
    theme?.colorBgStatistic};

  .statistic {
    display: flex;
    flex-direction: column;

    &:not(:last-of-type) {
      margin-bottom: var(--margin-bottom);
    }

    .label {
      font-size: 1.3rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .value {
      font-weight: 700;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      font-size: 1.9rem;
      margin-top: 0.5rem;
    }
  }
`;

export { Wrapper };
