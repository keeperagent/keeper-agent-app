import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;

  .group {
    margin-bottom: 3.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .group-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    margin-bottom: 1.5rem;
  }

  .group-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 3rem;
    row-gap: 1rem;
  }
`;
