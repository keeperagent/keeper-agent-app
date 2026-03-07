import styled from "styled-components";
import { ITheme } from "@/style/theme";

export const sidebarWidth = "24rem";
export const collapsedSidebarWidth = "7rem";

const LayoutWrapper = styled.div`
  background-color: ${({ theme }) => theme.colorBgSecondary};
`;

interface MainSectionProps {
  isSidebarOpen: boolean;
}

const MainSectionWrapper = styled.div`
  position: relative;
  margin-left: ${(props: MainSectionProps) =>
    props.isSidebarOpen ? sidebarWidth : collapsedSidebarWidth};
  width: ${(props: MainSectionProps) =>
    props.isSidebarOpen
      ? `calc(100%-${sidebarWidth})`
      : `calc(100%-${collapsedSidebarWidth})`};
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease-in-out;
  background: ${({ theme }: { theme: ITheme }) => theme?.colorBgSecondary};

  &.fullscreen {
    margin-left: 0;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  min-height: calc(-4.9rem + 100vh);
  margin-top: 4.9rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  padding: 1rem 3rem;

  &.no-padding {
    padding: 0;
  }

  & > * {
    flex: 1 1 auto;
  }
`;

export { LayoutWrapper, ContentWrapper, MainSectionWrapper };
