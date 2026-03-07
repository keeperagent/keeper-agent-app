import xlsx from "xlsx";
import { resourceDB } from "@/electron/database/resource";
import { IResource, IResourceGroup } from "@/electron/type";
import { exportDataToExcel, logEveryWhere } from "./util";
import { encryptionService } from "./encrypt";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { getResourceColumn } from "@/service/tableView";
import { WALLET_SHEET_HEADER } from "./wallet";

export const SHEET_HEADER = {
  COLUMN_1: "COLUMN_1",
  COLUMN_2: "COLUMN_2",
  COLUMN_3: "COLUMN_3",
  COLUMN_4: "COLUMN_4",
  COLUMN_5: "Column_5",
  COLUMN_6: "COLUMN_6",
  COLUMN_7: "COLUMN_7",
  COLUMN_8: "COLUMN_8",
  COLUMN_9: "COLUMN_9",
  COLUMN_10: "COLUMN_10",
};

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
      let resource: IResource = {
        groupId,
        col1: data[SHEET_HEADER.COLUMN_1],
        col2: data[SHEET_HEADER.COLUMN_2],
        col3: data[SHEET_HEADER.COLUMN_3],
        col4: data[SHEET_HEADER.COLUMN_4],
        col5: data[SHEET_HEADER.COLUMN_5],
        col6: data[SHEET_HEADER.COLUMN_6],
        col7: data[SHEET_HEADER.COLUMN_7],
        col8: data[SHEET_HEADER.COLUMN_8],
        col9: data[SHEET_HEADER.COLUMN_9],
        col10: data[SHEET_HEADER.COLUMN_10],
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

  return {
    ...resource,
    col1:
      resource?.col1 && Boolean(resourceGroup?.col1IsEncrypt)
        ? encryptionService.encryptData(resource?.col1, encryptKey)
        : resource?.col1,
    col2:
      resource?.col2 && Boolean(resourceGroup?.col2IsEncrypt)
        ? encryptionService.encryptData(resource?.col2, encryptKey)
        : resource?.col2,
    col3:
      resource?.col3 && Boolean(resourceGroup?.col3IsEncrypt)
        ? encryptionService.encryptData(resource?.col3, encryptKey)
        : resource?.col3,
    col4:
      resource?.col4 && Boolean(resourceGroup?.col4IsEncrypt)
        ? encryptionService.encryptData(resource?.col4, encryptKey)
        : resource?.col4,
    col5:
      resource?.col5 && Boolean(resourceGroup?.col5IsEncrypt)
        ? encryptionService.encryptData(resource?.col5, encryptKey)
        : resource?.col5,
    col6:
      resource?.col6 && Boolean(resourceGroup?.col6IsEncrypt)
        ? encryptionService.encryptData(resource?.col6, encryptKey)
        : resource?.col6,
    col7:
      resource?.col7 && Boolean(resourceGroup?.col7IsEncrypt)
        ? encryptionService.encryptData(resource?.col7, encryptKey)
        : resource?.col7,
    col8:
      resource?.col8 && Boolean(resourceGroup?.col8IsEncrypt)
        ? encryptionService.encryptData(resource?.col8, encryptKey)
        : resource?.col8,
    col9:
      resource?.col9 && Boolean(resourceGroup?.col9IsEncrypt)
        ? encryptionService.encryptData(resource?.col9, encryptKey)
        : resource?.col9,
    col10:
      resource?.col10 && Boolean(resourceGroup?.col10IsEncrypt)
        ? encryptionService.encryptData(resource?.col10, encryptKey)
        : resource?.col10,
    col1IsEncrypt: resourceGroup?.col1IsEncrypt,
    col2IsEncrypt: resourceGroup?.col2IsEncrypt,
    col3IsEncrypt: resourceGroup?.col3IsEncrypt,
    col4IsEncrypt: resourceGroup?.col4IsEncrypt,
    col5IsEncrypt: resourceGroup?.col5IsEncrypt,
    col6IsEncrypt: resourceGroup?.col6IsEncrypt,
    col7IsEncrypt: resourceGroup?.col7IsEncrypt,
    col8IsEncrypt: resourceGroup?.col8IsEncrypt,
    col9IsEncrypt: resourceGroup?.col9IsEncrypt,
    col10IsEncrypt: resourceGroup?.col10IsEncrypt,
    isEncrypted: true,
  };
};

const decryptResource = (
  resource: IResource,
  encryptKey?: string,
): IResource => {
  if (!encryptKey || !resource?.isEncrypted) {
    return resource;
  }

  return {
    ...resource,
    col1:
      resource?.col1 && Boolean(resource?.col1IsEncrypt)
        ? encryptionService.decryptData(resource?.col1, encryptKey)
        : resource?.col1,
    col2:
      resource?.col2 && Boolean(resource?.col2IsEncrypt)
        ? encryptionService.decryptData(resource?.col2, encryptKey)
        : resource?.col2,
    col3:
      resource?.col3 && Boolean(resource?.col3IsEncrypt)
        ? encryptionService.decryptData(resource?.col3, encryptKey)
        : resource?.col3,
    col4:
      resource?.col4 && Boolean(resource?.col4IsEncrypt)
        ? encryptionService.decryptData(resource?.col4, encryptKey)
        : resource?.col4,
    col5:
      resource?.col5 && Boolean(resource?.col5IsEncrypt)
        ? encryptionService.decryptData(resource?.col5, encryptKey)
        : resource?.col5,
    col6:
      resource?.col6 && Boolean(resource?.col6IsEncrypt)
        ? encryptionService.decryptData(resource?.col6, encryptKey)
        : resource?.col6,
    col7:
      resource?.col7 && Boolean(resource?.col7IsEncrypt)
        ? encryptionService.decryptData(resource?.col7, encryptKey)
        : resource?.col7,
    col8:
      resource?.col8 && Boolean(resource?.col8IsEncrypt)
        ? encryptionService.decryptData(resource?.col8, encryptKey)
        : resource?.col8,
    col9:
      resource?.col9 && Boolean(resource?.col9IsEncrypt)
        ? encryptionService.decryptData(resource?.col9, encryptKey)
        : resource?.col9,
    col10:
      resource?.col10 && Boolean(resource?.col10IsEncrypt)
        ? encryptionService.decryptData(resource?.col10, encryptKey)
        : resource?.col10,
    isEncrypted: false,
  };
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
