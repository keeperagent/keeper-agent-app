import fs from "fs-extra";
import path from "path";
import { getDbPath } from "@/electron/database/common";
import { IFolder, IFile } from "@/electron/type";
import { logEveryWhere } from "./util";

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
    logEveryWhere({ message: `getDatabaseFileStatistic() error: ${err?.message}` });
    return [null, err];
  }
};

const getFolderStatistic = async (
  folderPath: string,
  limit: number,
): Promise<[IFolder[], number | null, number | null, Error | null]> => {
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
      if (listFolder.length >= limit) {
        continue;
      }

      const subFolderPath = path.join(folderPath, file?.name);
      const [lastEditTime, err] = await getLastEditTimeOfFolder(subFolderPath);
      if (err || !lastEditTime) {
        continue;
      }

      const [folderSize, err1] = await getFolderSize(subFolderPath);
      if (err1 || folderSize === null) {
        continue;
      }
      totalSize += folderSize;
      listFolder.push({
        name: file?.name,
        path: subFolderPath,
        lastEdit: lastEditTime,
        size: folderSize,
      });
    }

    return [listFolder, totalFolder, totalSize, null];
  } catch (err: any) {
    logEveryWhere({ message: `getFolderStatistic() error: ${err?.message}` });
    return [[], null, null, err];
  }
};

const getLastEditTimeOfFolder = async (
  folderPath: string,
): Promise<[number | null, Error | null]> => {
  try {
    const stats = await fs.stat(folderPath);
    return [stats?.mtime.getTime(), null];
  } catch (err: any) {
    logEveryWhere({ message: `getLastEditTimeOfFolder() error: ${err?.message}` });
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
