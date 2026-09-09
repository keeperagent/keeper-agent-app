import styled from "styled-components";
import { FillHeightPage } from "@/style/layout";

const PageWrapper = styled(FillHeightPage)`
  font-size: 1.6rem;

  .tab {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    flex-shrink: 0;
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`;

export { PageWrapper };
