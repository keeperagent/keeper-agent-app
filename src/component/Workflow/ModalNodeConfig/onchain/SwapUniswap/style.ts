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

  .ant-form-item-label {
    label {
      width: 100%;

      &::after {
        display: none;
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

  .collapse {
    margin-bottom: 0.5rem;
    margin-top: -0.7rem;
    margin-left: -0.3rem;

    .ant-collapse-header {
      padding: 0.5rem 0;
      font-size: 1.3rem;
      display: flex;
      align-items: center;

      .ant-collapse-arrow {
        font-size: 1rem;
      }
    }

    .ant-collapse-content-box {
      padding-block: 0 !important;
      padding: 0 !important;
    }

    .ant-collapse-header-text {
      margin-left: -0.5rem;
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

const ChainLabelWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-end;

  .tag {
    font-size: 0.9rem;
    margin-left: auto;
    margin-right: 0;
    margin-bottom: 0;
    margin-top: 0;

    .content {
      display: flex;
      align-items: center;

      .text {
        margin-right: 0.4rem;
        font-weight: 600;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;

        svg {
          width: 0.9rem;
          height: 0.9rem;
          min-width: 0.9rem;
          min-height: 0.9rem;
        }
      }
    }
  }
`;

const ContractWrapper = styled.div`
  font-size: 1.3rem;

  .address {
    display: flex;
    align-items: center;

    .text {
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
    }

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 1rem;
      cursor: pointer;

      svg {
        width: 1.3rem;
        height: 1.3rem;
        min-width: 1.3rem;
        min-height: 1.3rem;
      }
    }
  }
`;

export {
  Wrapper,
  OptionWrapper,
  ChainWrapper,
  ChainLabelWrapper,
  ContractWrapper,
};
