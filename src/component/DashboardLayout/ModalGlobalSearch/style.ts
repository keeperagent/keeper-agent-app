import styled from "styled-components";
import { ITheme } from "@/style/theme";

const ModalWrapper = styled.div`
  margin-top: 3rem;

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .result {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    overflow-y: auto;

    .title {
      margin-top: 2rem;
      font-size: 1.5rem;
      font-weight: 800;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .result-list {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      padding-right: 0.5rem;
    }
  }
`;

const SearchResultWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-basis: 48%;
  border-radius: var(--border-radius);
  border: 2px solid transparent;
  padding: var(--padding-small);
  margin: 0.7rem 0;
  cursor: pointer;
  background-color: ${({ theme }: { theme: ITheme }) =>
    theme?.colorBgTransparent};
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

  &:hover {
    border: 2px dashed ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};

    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.4rem;
    font-weight: 600;
    transition: all 0.2s ease-in-out;
  }

  .description {
    font-size: 1.1rem;
    font-weight: 400;
    margin-bottom: var(--margin-bottom-small);
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  }

  .update-at,
  .total-data {
    display: flex;
    font-size: 1.2rem;

    .label {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }

    .value {
      margin-left: 0.5rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

export { ModalWrapper, SearchResultWrapper };
