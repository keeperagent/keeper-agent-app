import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .setting {
    cursor: pointer;
    margin-right: auto;

    svg {
      width: 2rem;
      height: 2rem;
      min-width: 2rem;
      min-height: 2rem;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;

  &.link {
    cursor: pointer;

    &:hover {
      color: var(--color-text-hover);
      font-weight: 500;
    }
  }

  .color {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.3rem;
    margin-right: 1rem;
  }

  .name {
  }
`;

export { PageWrapper, NameWrapper };
