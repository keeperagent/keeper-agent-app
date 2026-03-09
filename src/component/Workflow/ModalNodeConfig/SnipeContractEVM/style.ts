import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  .token-mode {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--margin-bottom);

    & > * {
      flex-basis: 47%;
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

  .list-parameter {
    border: 1px dashed
      ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: var(--margin-bottom);

    .label-wrapper {
      display: flex;
      align-items: center;
      font-size: 1.3rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .parameter {
      display: flex;
      flex-direction: column;
      width: 100%;

      .parameter-label {
        display: flex;
        align-items: center;
        width: 100%;
        margin-bottom: 0.5rem;

        .variable-name {
          margin-left: auto;
        }
      }
    }
  }

  .parameter-icon {
    align-self: center;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
      svg {
        fill: var(--color-primary);
      }
    }

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
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
