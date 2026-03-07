import styled from "styled-components";
import { ITheme } from "@/style/theme";

const TotalDataWrapper = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
`;

export { TotalDataWrapper };
