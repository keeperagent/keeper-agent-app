import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
  margin-bottom: 0.5rem;

  .status-row {
    display: flex;
    align-items: center;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
    font-weight: 500;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    margin-right: var(--margin-right);
  }

  .collapse {
    .ant-collapse-header {
      padding: 0.2rem 0;
      font-size: 1.1rem;
      display: flex;
      align-items: center;

      .ant-collapse-arrow {
        font-size: 1rem;
      }
    }

    .ant-collapse-content-box {
      padding-block: 0 !important;
      padding: 0 !important;
    }
  }

  .advanced {
    display: flex;
    margin: 0.5rem 0;

    .ant-btn {
      font-size: 1rem !important;
    }
  }
`;

export { Wrapper };
