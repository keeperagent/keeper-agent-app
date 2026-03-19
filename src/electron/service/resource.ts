import xlsx from "xlsx";
import { resourceDB } from "@/electron/database/resource";
import { IResource, IResourceGroup } from "@/electron/type";
import { exportDataToExcel, logEveryWhere } from "./util";
import { encryptionService } from "./encrypt";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { getResourceColumn } from "@/service/tableView";
import { WALLET_SHEET_HEADER } from "./wallet";
import { NUMBER_OF_COLUMN } from "../constant";

export const SHEET_HEADER: { [key: string]: string } = Object.fromEntries(
  Array.from({ length: NUMBER_OF_COLUMN }, (_, i) => {
    const num = i + 1;
    return [`COLUMN_${num}`, `COLUMN_${num}`];
  }),
);

const importResourceFromFile = async (
  listFilePath: string[],
  groupId: number,
  resourceGroup: IResourceGroup,
  encryptKey?: string,
): Promise<boolean> => {
  const listResource: IResource[] = [];

  listFilePath.forEach((filePath: string) => {
    const workbook = xlsx.readFile(filePath);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const listData = xlsx.utils.sheet_to_json(sheet);
    listData.forEach((data: any) => {
      const colValues: any = {};
      for (let i = 1; i <= NUMBER_OF_COLUMN; i++) {
        colValues[`col${i}`] = data[SHEET_HEADER[`COLUMN_${i}`]];
      }
      let resource: IResource = {
        groupId,
        ...colValues,
      };
      if (encryptKey) {
        resource = encryptResource(resource, resourceGroup, encryptKey);
      }
      listResource.push(resource);
    });
  });

  const err = await resourceDB.createBulkResource(listResource);
  return !err;
};

const exportResource = async ({
  groupId,
  folderPath,
  fileName,
  encryptKey,
}: {
  groupId: number;
  folderPath: string;
  fileName: string;
  encryptKey?: string;
}): Promise<Error | null> => {
  try {
    if (!groupId) {
      return Error("@groupId is empty");
    }
    if (!folderPath) {
      return Error("@folderPath is empty");
    }

    let currentPage = 1;
    const pageSize = 1000;
    let listResource: IResource[] = [];

    while (true) {
      const [res] = await resourceDB.getListResource({
        page: currentPage,
        pageSize,
        groupId,
      });

      const listData = res?.data || [];
      listResource = [...listResource, ...listData];

      if (listData.length === 0) {
        break;
      }

      currentPage += 1;
    }

    const excelWalletData = await convertResourceDataToExcelData(
      listResource,
      groupId,
      encryptKey,
    );

    await exportDataToExcel(excelWalletData, `${folderPath}/${fileName}.xlsx`);
    return null;
  } catch (err: any) {
    logEveryWhere({ message: `exportWallet() error: ${err?.message}` });
    return err;
  }
};

const encryptResource = (
  resource: IResource,
  resourceGroup: IResourceGroup,
  encryptKey?: string,
): IResource => {
  if (!encryptKey) {
    return { ...resource, isEncrypted: false };
  }

  const encrypted: any = { ...resource, isEncrypted: true };
  for (let i = 1; i <= NUMBER_OF_COLUMN; i++) {
    const colKey = `col${i}`;
    const colIsEncryptKey = `col${i}IsEncrypt`;
    const colValue = (resource as any)?.[colKey];
    const isEncrypt = Boolean((resourceGroup as any)?.[colIsEncryptKey]);
    encrypted[colKey] =
      colValue && isEncrypt
        ? encryptionService.encryptData(colValue, encryptKey)
        : colValue;
    encrypted[colIsEncryptKey] = (resourceGroup as any)?.[colIsEncryptKey];
  }

  return encrypted;
};

const decryptResource = (
  resource: IResource,
  encryptKey?: string,
): IResource => {
  if (!encryptKey || !resource?.isEncrypted) {
    return resource;
  }

  const decrypted: any = { ...resource, isEncrypted: false };
  for (let i = 1; i <= NUMBER_OF_COLUMN; i++) {
    const colKey = `col${i}`;
    const colIsEncryptKey = `col${i}IsEncrypt`;
    const colValue = (resource as any)?.[colKey];
    const isEncrypt = Boolean((resource as any)?.[colIsEncryptKey]);
    decrypted[colKey] =
      colValue && isEncrypt
        ? encryptionService.decryptData(colValue, encryptKey)
        : colValue;
  }

  return decrypted;
};

const convertResourceDataToExcelData = async (
  listResourceData: IResource[],
  groupId: number,
  encryptKey?: string,
) => {
  const excelData = [];
  if (listResourceData.length === 0) {
    return [];
  }

  const [group, err] = await resourceGroupDB.getOneResourceGroup(groupId);
  if (err || !group) {
    return [];
  }
  const columnConfig = getResourceColumn(group);
  const sheetHeader = columnConfig?.map((column) => column?.title);
  sheetHeader.push(WALLET_SHEET_HEADER.IS_ENCRYPTED);

  // Push column name
  excelData.push(sheetHeader);

  // Iterate through each object in data
  for (const resource of listResourceData) {
    const row: any[] = [];

    const resourceData: any =
      encryptKey && resource?.isEncrypted
        ? decryptResource({ ...resource }, encryptKey)
        : resource;

    let isEncrypted = "0";
    if (resource?.isEncrypted && !encryptKey) {
      isEncrypted = "1";
    }

    columnConfig?.forEach((column) => {
      row.push(resourceData[column?.dataIndex!]);
    });
    row.push(isEncrypted);
    excelData.push(row);
  }

  return excelData;
};

export {
  importResourceFromFile,
  exportResource,
  encryptResource,
  decryptResource,
};
