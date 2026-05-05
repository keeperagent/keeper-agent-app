import styled from "styled-components";
import { ITheme } from "@/style/theme";
import { markdownStyles } from "@/style/markdown";

const PageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.6rem;

  .heading {
    width: 100%;
    margin-bottom: var(--margin-bottom-large);
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .setting {
    cursor: pointer;
    margin-right: auto;

    svg {
      width: 2rem;
      height: 2rem;
      min-width: 2rem;
      min-height: 2rem;
      padding: 0.2rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;

  &.link {
    cursor: pointer;

    &:hover {
      color: var(--color-text-hover);
      font-weight: 500;
    }
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const EventCellWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;

  .event-left {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
    flex: 1;
  }

  .schedule-name {
    font-weight: 600;
    font-size: 1.3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-time {
    font-size: 1.1rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    white-space: nowrap;
  }
`;

const CampaignWorkflowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  .campaign-name {
    font-size: 1.3rem;
    font-weight: 600;
  }

  .workflow-name {
    font-size: 1.2rem;
  }
`;

const ResultMarkdownTooltip = styled.div`
  font-size: 1.3rem;
  line-height: 1.5;
  max-width: 48rem;
  max-height: 40rem;
  overflow-y: auto;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};

  ${markdownStyles}
`;

const ResultCellPreview = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  font-size: 1.2rem;
`;

export {
  PageWrapper,
  NameWrapper,
  EventCellWrapper,
  CampaignWorkflowWrapper,
  ResultMarkdownTooltip,
  ResultCellPreview,
};
