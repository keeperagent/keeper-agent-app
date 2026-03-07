import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;

  .tab {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .form {
    display: flex;
    flex-direction: column;
    width: 100%;

    .heading {
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: uppercase;
      color: ${({ theme }: { theme: ITheme; }) => theme.colorTextPrimary};
      display: flex;
      align-items: center;

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: var(--margin-left);

        svg {
          width: 1.3rem;
          height: 1.3rem;
          min-width: 1.3rem;
          min-height: 1.3rem;
        }
      }
    }
  }
`;

export { Wrapper };
