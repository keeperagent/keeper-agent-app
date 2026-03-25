import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 1.4rem;
  box-sizing: border-box;
  gap: 1.6rem;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 1rem;

    .header-title {
      font-size: 1.8rem;
      font-weight: 600;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }
  }

  .board {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.2rem;
    align-content: stretch;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(5, minmax(11rem, 1fr));
      overflow-x: auto;
      padding-bottom: 0.6rem;
    }
  }
`;

export const KanbanColumn = styled.div<{ isDragOver?: boolean }>`
  min-width: 0;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  background: ${({ theme }: { theme: ITheme }) => theme.colorBgUserMessage};
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid
    ${(props) =>
      props.isDragOver
        ? props.theme.colorPrimary
        : props.theme.colorBorder};
  transition: border-color 0.15s ease;

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme.colorBgTag};
    flex-shrink: 0;

    .column-title {
      font-weight: 600;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    }

    .column-count {
      background: ${({ theme }: { theme: ITheme }) =>
        theme.colorBgUserMessage};
      color: ${({ theme }: { theme: ITheme }) => theme.colorTextSecondary};
      border-radius: 10rem;
      padding: 0.1rem 0.7rem;
      font-size: 1.1rem;
      font-weight: 500;
    }
  }

  .column-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
`;
