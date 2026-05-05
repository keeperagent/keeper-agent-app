import styled from "styled-components";
import { ITheme } from "@/style/theme";
import { markdownStyles } from "@/style/markdown";

const Wrapper = styled.div`
  margin-top: 1.5rem;
  border: 2px dashed ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
  border-radius: var(--border-radius);
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
  display: flex;
  flex-direction: column;
  max-height: 28rem;
  overflow-y: auto;

  .plan-review-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};
    border-bottom: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorder};
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0;

    .plan-review-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .plan-review-title-block {
      flex: 1;
      min-width: 0;
    }

    .plan-review-title {
      font-size: 1.3rem;
      font-weight: 600;
      line-height: 1.4;
      color: var(--color-text-hover);
    }

    .plan-review-desc {
      font-size: 1.1rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
      margin-top: 0.1rem;
      line-height: 1.4;
    }
  }

  .plan-review-body {
    flex: 1;
    padding: 1rem 1.2rem;
    font-size: 1.25rem;
    line-height: 1.7rem;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    word-break: break-word;

    .plan-review-plan-box {
      padding: 0.8rem 1rem;
    }

    ${markdownStyles}
  }

  .plan-review-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    background: ${({ theme }: { theme: ITheme }) => theme?.colorBgPrimary};
    position: sticky;
    bottom: 0;
    z-index: 1;
    flex-shrink: 0;
  }
`;

export { Wrapper };
