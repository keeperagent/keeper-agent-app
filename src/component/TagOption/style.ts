import styled from "styled-components";
import { ITheme } from "@/style/theme";

const TagOptionWrapper = styled.div`
  width: 100%;
  padding: 1.1rem 1rem;
  display: flex;
  align-items: center;
  border-radius: var(--border-radius);
  border: 1px solid
    ${(props: any) =>
      props?.checked ? props?.theme?.colorBorderInput : "transparent"};
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  font-weight: 500;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 1.2rem;

  .radio-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 1rem;

    & > * {
      margin-top: 0 !important;
    }
  }

  .icon {
    margin-left: auto;

    & > * {
      height: 2rem;
      width: 2rem;
    }
  }
`;

export { TagOptionWrapper };
