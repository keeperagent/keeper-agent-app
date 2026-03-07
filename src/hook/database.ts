import { message, notification } from "antd";
import { MESSAGE } from "@/electron/constant";
import type {
  IpcExportDatabasePayload,
  IpcImportDatabasePayload,
} from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";
import { useTranslation } from "./useTranslation";

const useExportDatabase = () => {
  const { translate } = useTranslation();
  const { execute: exportDatabase, loading } =
    useIpcAction<IpcExportDatabasePayload>(
      MESSAGE.EXPORT_DATABASE,
      MESSAGE.EXPORT_DATABASE_RES,
      { onSuccess: () => message.success(translate("hook.exportDataDone")) },
    );
  return { loading, exportDatabase };
};

const useImportDatabase = () => {
  const { translate } = useTranslation();
  const { execute: importDatabase, loading } =
    useIpcAction<IpcImportDatabasePayload>(
      MESSAGE.IMPORT_DATABASE,
      MESSAGE.IMPORT_DATABASE_RES,
      {
        onSuccess: ({ error }: any) => {
          if (error) {
            message.error(error);
          } else {
            notification.success({
              message: translate("hook.syncDataDone"),
              duration: 15,
            });
          }
        },
      },
    );
  return { loading, importDatabase };
};

export { useExportDatabase, useImportDatabase };
