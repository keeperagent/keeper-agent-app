import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const RightPanel = styled.div`
  border-left: 1px solid ${({ theme }: { theme: ITheme }) => theme.colorBorder};
  padding-left: 2.4rem;
  max-height: 60rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  &::-webkit-scrollbar {
    width: 0.4rem;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }: { theme: ITheme }) => theme.scrollBarThumbColor};
    border-radius: 10rem;
  }
`;

export const AgentSelectWrapper = styled.div`
  .ant-select-selection-item {
    display: flex;
    align-items: center;
  }

  .selected-label {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    overflow: hidden;
  }

  .selected-logo {
    width: 1.8rem;
    height: 1.8rem;
    min-width: 1.8rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .selected-name {
    font-size: 1.3rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.2rem 0;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .provider-col {
    width: 2.8rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .provider-logo {
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .info-col {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .name {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    font-size: 1.3rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.1s ease;
  }

  .description {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-size: 1.1rem;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .active-count {
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    font-size: 1rem;
    font-weight: 300;
    opacity: 0.7;
  }
`;
