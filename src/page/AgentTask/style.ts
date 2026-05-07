import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 1.4rem;
  box-sizing: border-box;
  gap: 1.6rem;
  padding: 0.9rem 1.6rem 1.6rem 1.6rem;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding-top: 1.6rem;
    gap: 1.2rem;
  }

  .header-filters {
    display: flex;
    align-items: center;
    gap: var(--margin-right);

    .filter-select {
      width: 20rem;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-shrink: 0;
  }

  .board {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(24rem, 1fr));
    gap: 1.2rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.6rem;

    &::-webkit-scrollbar {
      height: 0.5rem;
    }

    &::-webkit-scrollbar-track {
      background: ${({ theme }: { theme: ITheme }) =>
        theme.scrollBarTrackColor};
      border-radius: 10rem;
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ theme }: { theme: ITheme }) =>
        theme.scrollBarThumbColor};
      border-radius: 10rem;
    }
  }
`;

export const OptionWrapper = styled.div`
  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-size: 1.1rem;
    font-weight: 300;
  }
`;
