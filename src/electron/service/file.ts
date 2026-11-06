import fs from "fs-extra";
import path from "path";
import { getDbPath } from "@/electron/database/common";
import { IFolder, IFile } from "@/electron/type";
import { logEveryWhere } from "./util";
import { getOrFetch } from "./ttlCache";

const FOLDER_STATISTIC_CACHE_TTL_MS = 30000;

type IFolderStatisticRaw = {
  listFolder: IFolder[];
  totalFolder: number;
  totalSize: number;
};

const getDatabaseFileStatistic = async (): Promise<
  [IFile | null, Error | null]
> => {
  try {
    const stats = await fs.stat(getDbPath());
    const fileInfo: IFile = {
      path: getDbPath(),
      size: stats?.size,
    };

    return [fileInfo, null];
  } catch (err: any) {
    logEveryWhere({
      message: `getDatabaseFileStatistic() error: ${err?.message}`,
    });
    return [null, err];
  }
};

const fetchFolderStatisticRaw = (folderPath: string, limit: number) =>
  getOrFetch<IFolderStatisticRaw>(
    `folderStatistic:${folderPath}:${limit}`,
    FOLDER_STATISTIC_CACHE_TTL_MS,
    async () => {
      try {
        const listFolder: IFolder[] = [];
        let totalFolder = 0;
        const files = await fs.readdir(folderPath, { withFileTypes: true });
        let totalSize = 0;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.isDirectory()) {
            continue;
          }

          totalFolder += 1;
          const subFolderPath = path.join(folderPath, file?.name);

          const [folderSize, sizeErr] = await getFolderSize(subFolderPath);
          if (sizeErr || folderSize === null) {
            continue;
          }
          totalSize += folderSize;

          if (listFolder.length >= limit) {
            continue;
          }

          const [lastEditTime, editErr] =
            await getLastEditTimeOfFolder(subFolderPath);
          if (editErr || !lastEditTime) {
            continue;
          }
          listFolder.push({
            name: file?.name,
            path: subFolderPath,
            lastEdit: lastEditTime,
            size: folderSize,
          });
        }

        return [{ listFolder, totalFolder, totalSize }, null];
      } catch (err: any) {
        logEveryWhere({
          message: `getFolderStatistic() error: ${err?.message}`,
        });
        return [null, err];
      }
    },
  );

const getFolderStatistic = async (
  folderPath: string,
  limit: number,
): Promise<[IFolder[], number | null, number | null, Error | null]> => {
  const [raw, err] = await fetchFolderStatisticRaw(folderPath, limit);
  if (err || !raw) {
    return [[], null, null, err];
  }
  return [raw.listFolder, raw.totalFolder, raw.totalSize, null];
};

const getLastEditTimeOfFolder = async (
  folderPath: string,
): Promise<[number | null, Error | null]> => {
  try {
    const stats = await fs.stat(folderPath);
    return [stats?.mtime.getTime(), null];
  } catch (err: any) {
    logEveryWhere({
      message: `getLastEditTimeOfFolder() error: ${err?.message}`,
    });
    return [null, err];
  }
};

const getFolderSize = async (
  folderPath: string,
): Promise<[number | null, Error | null]> => {
  try {
    let totalSize = 0;

    const traverseDir = async (dirPath: string) => {
      const files = await fs.readdir(dirPath);

      const promises = files?.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats?.isFile()) {
          totalSize += stats?.size;
        } else if (stats.isDirectory()) {
          await traverseDir(filePath);
        }
      });

      await Promise.all(promises);
    };

    await traverseDir(folderPath);
    return [totalSize, null];
  } catch (err: any) {
    logEveryWhere({ message: `getFolderSize() error: ${err?.message}` });
    return [null, err];
  }
};

const deleteFolder = async (folderPath: string): Promise<Error | null> => {
  try {
    const isExist = fs.pathExistsSync(folderPath);

    if (isExist) {
      fs.rmSync(folderPath, { recursive: true, maxRetries: 15 });
    }

    return null;
  } catch (err: any) {
    logEveryWhere({ message: `deleteFolder() error: ${err?.message}` });
    return err;
  }
};

export { getFolderStatistic, getDatabaseFileStatistic, deleteFolder };
