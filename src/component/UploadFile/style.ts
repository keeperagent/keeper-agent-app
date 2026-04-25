import styled from "styled-components";
import { ITheme } from "@/style/theme";

const UploadFileWrapper = styled.div<{ fullSize: boolean }>`
  .upload {
    min-width: 35rem;
    width: 100%;
    height: ${(props: any) => (props?.fullSize ? "100%" : "19rem")};
    border: ${(props: any) =>
      props?.fullSize ? "none" : `2px dashed ${props?.theme?.colorBorder}`};
    border-radius: ${(props: any) => (props?.fullSize ? "none" : "1rem")};
    position: relative;
    transition: all 0.2s ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
      background-color: ${({ theme }: { theme: ITheme }) =>
        theme?.colorBgPrimary};
      border: 2px dashed
        ${({ theme }: { theme: ITheme }) => theme?.colorBorderInput};
    }

    .placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 99%;
      height: 99%;
      border-radius: 1rem;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;

        svg {
          height: 3rem;
          min-height: 3rem;
        }
      }

      .title {
        font-weight: 400;
        font-size: 1.3rem;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
        margin-top: 1.5rem;

        span {
          color: ${({ theme }: { theme: ITheme }) => theme?.colorPrimary};
          font-weight: 600;
        }
      }

      .sub-title {
        font-size: 1.2rem;
        margin-top: 0.7rem;
        font-weight: 500;
        text-align: center;
        color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }

    .text {
      color: var(--color-text-light);
      font-size: 3rem;
      font-weight: 500;
    }

    input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      opacity: 0;
    }
  }

  .list-file {
    margin-top: var(--margin-top);
    max-height: 25rem;
    overflow-y: auto;
  }

  .statistic {
    font-size: 1.1rem;
    margin-top: var(--margin-top);
    text-align: right;
    color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};

    span {
      font-weight: 700;
      font-size: 1.4rem;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
    }
  }
`;

const FileItemWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  background-color: ${({ theme }: { theme: ITheme }) => theme?.colorBgTag};
  border: 1px dashed transparent;
  margin: 0 0.5rem;

  &:not(:first-of-type) {
    margin-top: 1rem;
  }

  &:hover {
    border: 1px dashed var(--color-gray);
  }

  .icon {
    img {
      width: 4rem;
    }
  }

  .file-info {
    margin-left: 1rem;

    .name {
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      font-size: 1.2rem;
      font-weight: 500;
    }

    .size {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }
  }

  .close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    height: 2.3rem;
    width: 2.3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.3rem;
    cursor: pointer;

    &:hover {
      svg {
        fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextPrimary};
      }
    }

    svg {
      height: 2.3rem;
      width: 2.3rem;
      min-width: 2.3rem;
      min-height: 2.3rem;
      fill: ${({ theme }: { theme: ITheme }) => theme?.colorTextSecondary};
    }
  }

  .status {
    position: absolute;
    bottom: 0.5rem;
    right: 1rem;
    white-space: nowrap;

    .tag {
      margin: 0;
      font-size: 0.9rem;

      .content {
        display: flex;
        align-items: center;

        .icon {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 0.4rem;

          svg {
            width: 0.9rem;
            height: 0.9rem;
            min-width: 0.9rem;
            min-height: 0.9rem;
          }
        }

        .text {
        }
      }
    }
  }
`;

export { UploadFileWrapper, FileItemWrapper };
