import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  width: 100%;

  .heading {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--margin-right);
    margin-bottom: 1.6rem;
  }

  .cell-sub-label {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    margin-top: 0.2rem;
  }

  .list-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 1.7rem;

    svg {
      width: 1.7rem;
      height: 1.7rem;
      min-width: 1.7rem;
      min-height: 1.7rem;
      cursor: pointer;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

      &:hover {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }
  }
`;

const OtherSettingsPanel = styled.div`
  padding: 1.6rem;

  .panel-title {
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    margin-bottom: 1.6rem;
  }
`;

export { Wrapper, OtherSettingsPanel };
