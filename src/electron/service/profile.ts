import _ from "lodash";
import { IProfile, IResource } from "@/electron/type";
import { profileDB } from "@/electron/database/profile";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { WALLET_SHEET_HEADER, decryptWallet } from "./wallet";
import { decryptResource } from "./resource";
import { getResourceColumn } from "@/service/tableView";
import { exportDataToExcel, logEveryWhere } from "./util";

type IArray = any[];

const generateMix = (listArray: IArray[]): IArray => {
  const listLength = listArray?.map((array: IArray) => array?.length);
  const maxLength = _.max(listLength) || 0;
  const result: IArray[] = [];
  const mapArrayLength: { [key: string]: number } = {};
  listArray.forEach((array: IArray, index: number) => {
    mapArrayLength[index] = array.length;
  });

  for (let i = 0; i < maxLength; i++) {
    const resultItem: IArray = [];
    listArray.forEach((array: IArray, index: number) => {
      const length = mapArrayLength[index];
      const resultItemIndex = i % length;
      resultItem.push(array[resultItemIndex]);
    });

    result.push(resultItem);
  }

  return result;
};

const exportProfile = async ({
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
    let listProfile: IProfile[] = [];

    while (true) {
      const [res] = await profileDB.getListProfile(
        currentPage,
        pageSize,
        undefined,
        groupId,
      );

      const listData = res?.data || [];
      listProfile = [...listProfile, ...listData];

      if (listData.length === 0) {
        break;
      }

      currentPage += 1;
    }

    const [excelWalletData, mergedColumnInfo] =
      await convertProfileDataToExcelData(listProfile, groupId, encryptKey);

    await exportDataToExcel(
      excelWalletData,
      `${folderPath}/${fileName}.xlsx`,
      mergedColumnInfo,
    );
    return null;
  } catch (err: any) {
    logEveryWhere({ message: `exportWallet() error: ${err?.message}` });
    return err;
  }
};

const convertProfileDataToExcelData = async (
  listProfileData: IProfile[],
  groupId: number,
  encryptKey?: string,
) => {
  const excelData = [];
  if (listProfileData.length === 0) {
    return [[]];
  }

  const [profileGroup, err] = await profileGroupDB.getOneProfileGroup(groupId);
  if (err || !profileGroup) {
    return [[]];
  }
  const isIncludeWallet = typeof profileGroup?.walletGroupId === "number";
  const groupedHeader = [];
  if (isIncludeWallet) {
    groupedHeader.push("Wallet", "", "");
  }
  profileGroup?.listResourceGroup?.forEach((resourceGroup) => {
    const columnConfig = getResourceColumn(resourceGroup);
    columnConfig?.forEach((column, index) => {
      groupedHeader.push(index === 0 ? resourceGroup.name : "");
    });
  });
  groupedHeader.push("");

  let sheetHeader: string[] = [];
  const mergedColumnInfo: any[] = [];
  if (isIncludeWallet) {
    mergedColumnInfo.push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: 2 },
    });
    sheetHeader = [
      WALLET_SHEET_HEADER.ADDRESS,
      WALLET_SHEET_HEADER.PHRASE,
      WALLET_SHEET_HEADER.PRIVATE_KEY,
    ];
  }

  profileGroup?.listResourceGroup?.forEach((resourceGroup) => {
    const columnConfig = getResourceColumn(resourceGroup);
    const startIndex = sheetHeader?.length;
    mergedColumnInfo.push({
      s: { r: 0, c: startIndex },
      e: { r: 0, c: startIndex + columnConfig?.length - 1 },
    });
    columnConfig?.forEach((column) => sheetHeader.push(column?.title!));
  });
  sheetHeader.push(WALLET_SHEET_HEADER.IS_ENCRYPTED);

  // Push column name
  excelData.push(groupedHeader);
  excelData.push(sheetHeader);

  // Iterate through each object in data
  for (const profile of listProfileData) {
    const row: any[] = [];

    let isProfileEncrypted = false;
    if (profile?.wallet?.isEncrypted) {
      isProfileEncrypted = true;
    }
    profile?.listResource?.forEach((resource) => {
      if (resource?.isEncrypted) {
        isProfileEncrypted = true;
      }
    });
    const profileData: any =
      encryptKey && isProfileEncrypted
        ? descryptProfile({ ...profile }, encryptKey)
        : profile;

    let isEncrypted = "0";
    if (isProfileEncrypted && !encryptKey) {
      isEncrypted = "1";
    }

    if (isIncludeWallet) {
      row.push(profileData?.wallet?.address);
      row.push(profileData?.wallet?.phrase);
      row.push(profileData?.wallet?.privateKey);
    }

    profileGroup?.listResourceGroup?.forEach((resourceGroup, index) => {
      const columnConfig = getResourceColumn(resourceGroup);
      const resource: any = profileData?.listResource?.[index] || {};
      columnConfig?.forEach((column) => {
        row.push(resource[column?.dataIndex!]);
      });
    });

    row.push(isEncrypted);
    excelData.push(row);
  }

  return [excelData, mergedColumnInfo];
};

const descryptProfile = (profile: IProfile, encryptKey?: string) => {
  return {
    ...profile,
    wallet: profile?.wallet
      ? decryptWallet(profile?.wallet, encryptKey)
      : profile?.wallet,
    listResource:
      profile?.listResource && profile?.listResource?.length > 0
        ? profile?.listResource?.map((resource: IResource) =>
            decryptResource(resource, encryptKey),
          )
        : profile?.listResource,
  };
};

export { generateMix, exportProfile };
