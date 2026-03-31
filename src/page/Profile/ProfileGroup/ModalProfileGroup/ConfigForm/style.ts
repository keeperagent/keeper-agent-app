import styled from "styled-components";
import { ITheme } from "@/style/theme";

const FormWrapper = styled.div`
  margin-top: var(--margin-top);
  margin-bottom: var(--margin-bottom);

  .label {
    font-weight: 600;
    font-size: 1.2rem;
    color: ${({ theme }: { theme: ITheme }) => theme.colorTextPrimary};
    margin-bottom: 0.8rem;
    margin-left: 1px;
  }

  .select {
    display: flex;
    justify-content: space-between;

    .item {
      flex-basis: 47%;
      display: flex;

      .btn {
        font-size: 1.1rem;
        margin-left: 0.5rem;
      }
    }
  }

  .list-item {
    margin: var(--margin-bottom) 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--margin-right);
  }

  .chart {
    margin-bottom: 2rem;
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px dashed ${({ theme }: { theme: ITheme }) => theme.colorBorder};
    background-color: ${({ theme }: { theme: ITheme }) =>
      theme.colorBgSecondary};
  }

  .empty {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 3rem;
    margin-bottom: 3rem;

    img {
      height: 10rem;
    }

    .description {
      font-size: 1.3rem;
      color: var(--color-text);
      font-weight: 300;
      margin-left: 3rem;
    }
  }
`;

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
  }
`;

export { FormWrapper, OptionWrapper };
