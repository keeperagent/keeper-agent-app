import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  border: 1px dashed
    ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  margin-bottom: var(--margin-bottom);
  position: relative;

  .tool {
    position: absolute;
    top: 1rem;
    right: 1.1rem;
    display: flex;
    align-items: center;

    .order {
      background-color: var(--background-success);
      margin-left: 1rem;
      width: 2rem;
      height: 2rem;
      border-radius: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }

    .delete {
      cursor: pointer;
      display: flex;
      align-items: center;

      &:hover {
        svg {
          fill: var(--color-error);
        }
      }

      svg {
        width: 1.5rem;
        height: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }

  .input-password-wrapper {
    .ant-form-item {
      margin-bottom: 0 !important;
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

const ProviderRow = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const ProviderItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem 0.4rem 0.5rem;
  border-radius: 2rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgTransparent};

  &:hover {
    border-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  }

  &.active {
    border-color: var(--color-primary);
  }

  img {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  }
`;

export { Wrapper, OptionWrapper, ProviderRow, ProviderItem };
