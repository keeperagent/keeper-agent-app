import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;

  .actions {
    display: flex;
    gap: 1.5rem;
    width: 100%;
    margin-bottom: 2rem;

    .btn-add {
      margin-left: auto;
    }
  }

  .list-item {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    & > * {
      flex: 0 1 calc((100% - 2 * 12px) / 3);
      min-width: 0;
    }
  }

  .pagination-wrap {
    margin-top: 2rem;
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

export const HelperWrapper = styled.div`
  width: 100%;
  font-size: 1.3rem;
  text-align: center;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
  margin-bottom: 1rem;
`;
