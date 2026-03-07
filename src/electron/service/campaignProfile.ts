import {
  ICampaign,
  ICampaignProfile,
  IProfile,
  IResource,
} from "@/electron/type";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { campaignDB } from "@/electron/database/campaign";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { WALLET_SHEET_HEADER, decryptWallet } from "./wallet";
import { decryptResource } from "./resource";
import {
  getCampaignAdditionalColumn,
  getResourceColumn,
} from "@/service/tableView";
import { exportDataToExcel, logEveryWhere } from "./util";

const exportCampaignProfile = async ({
  campaignId,
  folderPath,
  fileName,
  encryptKey,
}: {
  campaignId: number;
  folderPath: string;
  fileName: string;
  encryptKey?: string;
}): Promise<Error | null> => {
  try {
    if (!campaignId) {
      return Error("@campaignId is empty");
    }
    if (!folderPath) {
      return Error("@folderPath is empty");
    }

    let currentPage = 1;
    const pageSize = 1000;
    let listProfile: IProfile[] = [];
    const [campaign, err] = await campaignDB.getOneCampaign(campaignId);
    if (err || !campaign) {
      return err;
    }

    while (true) {
      const [res] = await campaignProfileDB.getListCampaignProfile({
        page: currentPage,
        pageSize,
        campaignId,
      });

      const listData = res?.data || [];
      listProfile = [...listProfile, ...listData];

      if (listData.length === 0) {
        break;
      }

      currentPage += 1;
    }

    const [excelWalletData, mergedColumnInfo] =
      await convertCampaignProfileDataToExcelData(
        listProfile,
        campaign,
        encryptKey,
      );

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

const convertCampaignProfileDataToExcelData = async (
  listProfileData: ICampaignProfile[],
  campaign: ICampaign,
  encryptKey?: string,
) => {
  const excelData = [];
  if (listProfileData.length === 0) {
    return [[]];
  }

  const [profileGroup, err] = await profileGroupDB.getOneProfileGroup(
    campaign?.profileGroupId!,
  );
  if (err || !profileGroup) {
    return [[]];
  }
  const isIncludeWallet = typeof profileGroup?.walletGroupId === "number";

  // get groupedColumn
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
  excelData.push(groupedHeader);
  const additionalColumn = getCampaignAdditionalColumn(campaign);
  additionalColumn?.forEach(() => groupedHeader.push(""));
  groupedHeader.push(""); // column for Is_Encrypted

  // get subColumn
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
  additionalColumn?.forEach((column) => sheetHeader.push(column?.title!));
  sheetHeader.push(WALLET_SHEET_HEADER.IS_ENCRYPTED);
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
        ? decryptCampaignProfile({ ...profile }, encryptKey)
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

    additionalColumn?.forEach((column) => {
      row.push(profileData[column?.dataIndex!]);
    });
    row.push(isEncrypted);
    excelData.push(row);
  }

  return [excelData, mergedColumnInfo];
};

const decryptCampaignProfile = (
  profile: ICampaignProfile,
  encryptKey?: string,
) => {
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

export { exportCampaignProfile, decryptCampaignProfile };
