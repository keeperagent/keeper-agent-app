import styled from "styled-components";
import { ITheme } from "@/style/theme";

const PresetItemWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 0.7rem;
  border-radius: 0.4rem;
  font-size: 1.2rem;
  border-bottom: 1px solid
    ${({ theme }: { theme: ITheme }) => theme?.colorBorder};

  .preset-item-info {
    flex: 1;
    overflow: hidden;
    cursor: pointer;

    .preset-item-name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .preset-item-detail {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-top: 0.4rem;

      & > span {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        font-size: 1rem;
        background: ${({ theme }: { theme: ITheme }) =>
          theme?.colorBgTag || "rgba(0,0,0,0.06)"};
        border: 1px solid
          ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      }
    }
  }

  .preset-item-actions {
    display: flex;
    gap: 1.3rem;
    margin-left: 0.8rem;
    font-size: 1.1rem;
    flex-shrink: 0;

    & > * {
      cursor: pointer;
    }

    .preset-action-delete {
      color: var(--color-error);
    }
  }
`;

export { PresetItemWrapper };
