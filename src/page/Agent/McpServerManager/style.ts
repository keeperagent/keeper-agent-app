import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .actions {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    width: 100%;
    margin-bottom: 2rem;

    .btn-add {
      margin-left: auto;
    }
  }

  .list-item {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;

    & > * {
      flex: 0 0 calc((100% - 4rem) / 3);
    }
  }

  .pagination-wrap {
    margin-top: 5rem;
    display: flex;
    justify-content: center;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 9rem 2rem;
    text-align: center;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
    border: 1px solid ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    border-radius: var(--border-radius);

    .empty-title {
      font-size: 1.8rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      margin-bottom: 1rem;
    }

    .empty-description {
      font-size: 14px;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-bottom: 3rem;
    }
  }
`;
