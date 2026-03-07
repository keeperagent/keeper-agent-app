import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .info {
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    padding: 0.7rem 1.5rem;
    border-radius: var(--border-radius);

    .label {
      margin-right: 0.5rem;
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      font-weight: 500;
    }

    .value {
      font-weight: 600;
      font-size: 1.2rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

export { Wrapper };
