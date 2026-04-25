import { useEffect, useState } from "react";
import _ from "lodash";
import { UploadIcon } from "@/component/Icon";
import { deleteItemInList } from "@/service/util";
import { useTranslation } from "@/hook";
import { IFile } from "@/types/interface";
import { MESSAGE } from "@/electron/constant";
import { UploadFileWrapper } from "./style";
import FileItem from "./FileItem";
import { formatFileSize } from "./util";

type UploadFileProps = {
  fullSize?: boolean;
  listFile: IFile[];
  setListFile: (listFile: IFile[]) => void;
  listExt: string[];
  single?: boolean;
  mapErrorWithFile: { [key: number]: string };
  isUploaded?: boolean;
};

const UploadFile = (props: UploadFileProps) => {
  const { translate } = useTranslation();
  const {
    fullSize = false,
    listFile = [],
    setListFile,
    listExt,
    single,
    mapErrorWithFile,
    isUploaded,
  } = props;

  const [currentMapErrorWithFile, setCurrentMapErrorWithFile] = useState<{
    [key: number]: string;
  }>(mapErrorWithFile);

  useEffect(() => {
    setCurrentMapErrorWithFile(mapErrorWithFile);
  }, [mapErrorWithFile]);

  // Handle click - use Electron dialog for guaranteed file paths
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we're in Electron
    // Use Electron dialog for file selection (guarantees file paths)
    const filters =
      listExt?.length > 0
        ? [{ name: "Supported Files", extensions: listExt }]
        : undefined;

    window?.electron?.send(MESSAGE.CHOOSE_FILE, {
      filters,
      multiple: !single,
    });

    // Listen for response
    let unsubscribe: (() => void) | undefined;
    const handleFileSelection = (
      _event: any,
      data: {
        data: Array<{
          path: string;
          name: string;
          size: number;
          extension: string;
        }> | null;
      },
    ) => {
      if (data?.data && data.data.length > 0) {
        // Process file info from Electron dialog (includes path and size)
        const tempListFile = single ? [] : [...listFile];

        data.data.forEach(
          (fileInfo: {
            path: string;
            name: string;
            size: number;
            extension: string;
          }) => {
            const {
              path: filePath,
              name: fileName,
              size: fileSize,
              extension: fileExt,
            } = fileInfo;

            if (!listExt?.includes(fileExt)) {
              return;
            }

            // Create a file object with path and size from Electron dialog
            tempListFile.push({
              name: fileName,
              size: formatFileSize(fileSize),
              type: fileExt,
              path: filePath,
            });
          },
        );

        setListFile(tempListFile);
      }

      unsubscribe?.();
    };

    unsubscribe = window?.electron?.on(
      MESSAGE.CHOOSE_FILE_RES,
      handleFileSelection,
    );
  };

  const removeFile = (filePath: string) => {
    const tempListFile = [...listFile];
    const fileIndex = _.findIndex(tempListFile, { path: filePath });
    if (fileIndex !== -1) {
      setListFile(deleteItemInList(fileIndex, tempListFile));
      setCurrentMapErrorWithFile(_.omit(currentMapErrorWithFile, fileIndex));
    }
  };

  return (
    <UploadFileWrapper $fullSize={fullSize}>
      <div className="upload" onClick={handleClick}>
        {!fullSize ? (
          <div className="placeholder">
            <div className="icon">
              <UploadIcon />
            </div>

            <div className="title">
              <span>{translate("file.clickToSelect")}</span>
            </div>
            <div className="sub-title">
              {listExt
                ?.map((ext: string) => `.${ext}`)
                ?.join(` ${translate("or")} `)}
            </div>
          </div>
        ) : (
          <div className="text">{translate("file.clickToSelect")}</div>
        )}
      </div>

      <div className="list-file">
        {listFile?.map((file: IFile, index: number) => (
          <FileItem
            file={file}
            key={index}
            removeFile={removeFile}
            success={isUploaded ? !currentMapErrorWithFile?.[index] : undefined}
            error={currentMapErrorWithFile?.[index]}
          />
        ))}
      </div>

      {listFile.length > 0 && !single && (
        <div className="statistic">
          {translate("file.selectedFile")} <span>{listFile.length}</span>{" "}
          {translate("file.file")}
        </div>
      )}
    </UploadFileWrapper>
  );
};

export default UploadFile;
