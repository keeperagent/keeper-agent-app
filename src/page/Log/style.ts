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
  margin-top: var(--margin-top);

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
      width: 2.1rem;
      height: 2.1rem;
      min-width: 2.1rem;
      min-height: 2.1rem;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
  }
`;

export { PageWrapper, OptionWrapper };
