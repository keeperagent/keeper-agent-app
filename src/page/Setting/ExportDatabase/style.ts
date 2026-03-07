import styled from "styled-components";
import { ITheme } from "@/style/theme";

const Wrapper = styled.div`
  margin-top: var(--margin-top);

  .custom-input__export {
    border: 1px solid
      ${({ theme }: { theme: ITheme }) => theme?.colorBorderSecondary} !important;
  }
`;

const HelpWrapper = styled.div`
  display: flex;
  align-items: center;

  & > span {
    margin-right: 0.5rem;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 3rem;
  padding: 0 1rem;

  &:hover {
    svg {
      stroke: var(--color-primary);
    }
  }

  svg {
    height: 1.3rem;
    width: 1.3rem;
    min-width: 1.3rem;
    min-height: 1.3rem;
  }
`;

export { Wrapper, HelpWrapper, IconWrapper };
