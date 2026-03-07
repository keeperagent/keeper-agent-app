import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  background-color: var(--background-error);
  border: 0.5px solid var(--color-error);
  height: 100%;
  transform: scale(0.5);

  .content {
    font-size: 1rem;
    padding: 1rem 0.7rem;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    textarea {
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background-color: transparent;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

export { Wrapper };
