import { Tag, Tooltip } from "antd";
import { CloseIcon, CheckCircleIcon, CloseCircleIcon } from "@/component/Icon";
import sheetIcon from "@/asset/sheets.png";
import txtIcon from "@/asset/txt.png";
import zipIcon from "@/asset/zip.png";
import crxIcon from "@/asset/crx.png";
import defaultIcon from "@/asset/folder.png";
import { IFile } from "@/types/interface";
import { FILE_TYPE } from "@/config/constant";
import { FileItemWrapper } from "./style";
import { useMemo } from "react";
import { useTranslation } from "@/hook";

type FileItemProps = {
  file: IFile;
  removeFile: (filePath: string) => void;
  success?: boolean;
  error: string | null;
};

const FileItem = (props: FileItemProps) => {
  const { translate } = useTranslation();
  const { file, removeFile, success, error } = props;

  const fileIcon = useMemo(() => {
    switch (file.type) {
      case FILE_TYPE.XLSX:
        return sheetIcon;
      case FILE_TYPE.TXT:
        return txtIcon;
      case FILE_TYPE.ZIP:
        return zipIcon;
      case FILE_TYPE.CRX:
        return crxIcon;
      default:
        return defaultIcon;
    }
  }, [file?.type]);

  return (
    <FileItemWrapper>
      <div className="icon">
        <img src={fileIcon} alt="" />
      </div>

      <div className="file-info">
        <div className="name">{file?.name}</div>
        <div className="size">{file?.size}</div>
      </div>

      <div className="close" onClick={() => removeFile(file?.path)}>
        <CloseIcon />
      </div>

      {typeof success === "boolean" && (
        <div className="status">
          {success ? (
            <Tag className="tag" color="green">
              <div className="content">
                <span className="icon">
                  <CheckCircleIcon color="green" />
                </span>

                <span className="text">{translate("done")}</span>
              </div>
            </Tag>
          ) : (
            <Tooltip title={error}>
              <Tag className="tag" color="error">
                <div className="content">
                  <span className="icon">
                    <CloseCircleIcon color="red" />
                  </span>

                  <span className="text">{translate("error")}</span>
                </div>
              </Tag>
            </Tooltip>
          )}
        </div>
      )}
    </FileItemWrapper>
  );
};

export default FileItem;
