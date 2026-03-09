import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .add {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 3rem;

    .icon {
      border: 1px dashed
        ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      border-radius: 0.5rem;
      cursor: pointer;

      &:hover {
        border: 1px dashed
          ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

        svg {
          fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
        }
      }

      svg {
        height: 1rem;
        width: 1rem;
        min-width: 1rem;
        min-height: 1rem;
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }

  .node-provider-option {
    display: flex;
    justify-content: space-between;
    margin-top: var(--margin-top);
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 48%;
    }
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;
    margin-right: 1rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .content {
    display: flex;
    flex-direction: column;

    .name {
      font-size: 1.3rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      transition: all 0.1s ease-in-out;
    }

    .description {
      font-size: 1rem;
      font-weight: 400;
    }
  }
`;

const ChainWrapper = styled.div`
  display: flex;
  align-items: center;

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 0.7rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .text {
    font-size: 1.2rem;
  }
`;

export { Wrapper, OptionWrapper, ChainWrapper };
