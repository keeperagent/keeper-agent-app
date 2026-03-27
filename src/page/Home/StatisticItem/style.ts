import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.6rem 1rem;
  gap: 0.6rem;

  .value {
    font-weight: 700;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 2.6rem;
    line-height: 1;
  }

  .label {
    font-size: 1rem;
    font-weight: 700;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
`;

export { Wrapper };
