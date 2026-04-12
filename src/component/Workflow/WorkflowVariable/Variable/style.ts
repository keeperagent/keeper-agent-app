import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  max-width: 25rem;
  position: relative;

  &:not(:last-of-type) {
    margin-bottom: 0.5rem;
  }

  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  padding: 0.5rem 1.3rem;
  cursor: pointer;
  border-radius: var(--border-radius);
  border: 1px solid transparent;

  &:hover,
  &.active {
    background-color: var(--color-bg-primary);
    border: 1px dashed var(--color-primary);
  }

  .label {
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .source-label {
    font-size: 0.9rem;
    font-weight: 400;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    opacity: 0.7;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    margin-top: 0.1rem;
  }

  .source-type-badge {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    bottom: 0.5rem;
    right: 0.5rem;
    width: 0.5rem;
    height: 0.5rem;
  }

  .variable {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    display: flex;
    align-items: center;
    justify-content: space-between;

    .variable-name {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .icon {
      height: 1.1rem;
      width: 1.1rem;
      cursor: pointer;
      margin-left: var(--margin-left);
      margin-top: -0.5rem;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        height: 1.1rem;
        width: 1.1rem;
        min-width: 1.1rem;
        min-height: 1.1rem;
      }
    }
  }
`;

export { Wrapper };
