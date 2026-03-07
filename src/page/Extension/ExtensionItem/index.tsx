import { useEffect, useMemo, ComponentType } from "react";
import { message, Popconfirm } from "antd";
import { connect } from "react-redux";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { RootState } from "@/redux/store";
import { TrashIcon, OpenFolderIcon } from "@/component/Icon";
import { actSaveDeleteExtension } from "@/redux/extension";
import { IExtension } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import {
  useDeleteExtension,
  useImportExtension,
  useTranslation,
  useCreateBaseProfileExtension,
} from "@/hook";
import { ItemWrapper } from "./style";
import { MESSAGE } from "@/electron/constant";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

type IExtensionItemProps = {
  extension: IExtension;
  actSaveDeleteExtension: (payload: IExtension) => void;
  searchText?: string;
  setShouldRefetch: (value: boolean) => void;
};
const ExtensionItem = (props: IExtensionItemProps) => {
  const { translate } = useTranslation();
  const { extension, searchText = "", setShouldRefetch } = props;
  const { loading, isSuccess, deleteExtension, listDeletedId } =
    useDeleteExtension();
  const { getExtensionId } = useImportExtension();

  const {
    createBaseProfileExtension,
    isCreateBaseSuccess,
    isLoadingCreateBase,
  } = useCreateBaseProfileExtension();

  useEffect(() => {
    setShouldRefetch(true);
  }, [isCreateBaseSuccess, isLoadingCreateBase]);

  useEffect(() => {
    if (listDeletedId.includes(extension?.id!)) {
      if (!loading && isSuccess) {
        props.actSaveDeleteExtension(extension);
        message.success(translate("extension.delete.success"));

        setTimeout(() => {
          createBaseProfileExtension();
        }, 1000);
      } else if (!loading && !isSuccess) {
        message.error(translate("extension.delete.fail"));
      }
    }
  }, [loading, isSuccess, listDeletedId]);

  const formattedDes = useMemo(() => {
    if (!extension?.description) {
      return "";
    }

    const MAX_LENGTH = 90;
    return extension?.description?.length < MAX_LENGTH
      ? extension?.description
      : extension?.description?.slice(0, MAX_LENGTH) + "...";
  }, [extension?.description]);

  const onDelete = () => {
    deleteExtension([extension?.id!]);
    setTimeout(() => {
      setShouldRefetch(true);
    }, 2000);
  };

  const getExtensionIdOnBrowser = async (
    extensionPath: string,
    id?: number,
  ) => {
    message.warning(translate("extension.gettingExtensionId"));
    getExtensionId(extensionPath, id);
  };

  const onOpenFolder = () => {
    window?.electron?.send(MESSAGE.OPEN_FOLDER, {
      folderPath: extension?.storedAtPath,
    });
  };

  return (
    <ItemWrapper>
      <div className="logo">
        <img src={extension?.iconPath} alt="" />
      </div>

      <div className="info">
        <div className="name">
          <Highlighter
            textToHighlight={extension?.name || ""}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>
        <div className="description">
          <Highlighter
            textToHighlight={formattedDes}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>

        <div className="footer">
          <div className="extension-info">
            <div className="id">
              <span className="label">ID:</span>
              <span>{extension?.extensionId || EMPTY_STRING} </span>
            </div>
            <div className="version">
              <span className="label">Version:</span>
              <span>{extension?.version}</span>
            </div>
          </div>

          <div className="tool">
            {!extension?.extensionId && (
              <button
                className="btn-id"
                onClick={() =>
                  getExtensionIdOnBrowser(
                    extension?.storedAtPath || "",
                    extension?.id,
                  )
                }
              >
                {translate("extension.getExtensionId")}
              </button>
            )}

            <div className="btn-open__folder" onClick={onOpenFolder}>
              <OpenFolderIcon className="open-folder" />
            </div>

            <Popconfirm
              title={translate("extension.confirmDelete")}
              okText={translate("button.delete")}
              cancelText={translate("cancel")}
              onConfirm={onDelete}
            >
              <div className="btn-delete">
                <TrashIcon className="trash" />
              </div>
            </Popconfirm>
          </div>
        </div>
      </div>
    </ItemWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSaveDeleteExtension })(
  ExtensionItem,
);
