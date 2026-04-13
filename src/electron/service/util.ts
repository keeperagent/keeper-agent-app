import { uid } from "uid";
import { app } from "electron";
import xlsx from "xlsx";
import {
  ICampaignProfile,
  IProfile,
  IResource,
  IWallet,
  IStructuredLogPayload,
} from "@/electron/type";
import { mainWindow } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { decryptWallet } from "./wallet";
import { decryptResource } from "./resource";

// format string: /Users/Documents/ -> /Users/Documents
const removeLastTrailingSlash = (str: string): string => {
  return str.replace(/\/+$/, "");
};

const LOG_FLUSH_INTERVAL = 500;
const pendingLogs: { message: string; id: string }[] = [];
let logFlushTimer: ReturnType<typeof setInterval> | null = null;

const flushPendingLogs = (): void => {
  if (pendingLogs.length === 0) {
    return;
  }
  try {
    const batch = pendingLogs.slice();
    mainWindow?.webContents?.send(MESSAGE.LOG_BATCH, { data: batch });
    pendingLogs.splice(0, batch.length);
  } catch (err: any) {
    console.log("flushPendingLogs() error: ", err?.message);
  }
};

const logEveryWhere = (input: IStructuredLogPayload): void => {
  try {
    const message = JSON.stringify(input);
    if (!app.isPackaged) {
      console.log(message);
    }
    pendingLogs.push({ message, id: uid(15) });

    if (!logFlushTimer) {
      logFlushTimer = setInterval(() => {
        flushPendingLogs();
      }, LOG_FLUSH_INTERVAL);
    }
  } catch (err: any) {
    console.log("logEveryWhere() error: ", err?.message);
  }
};

const exportDataToExcel = async (
  data: any[],
  fileName: string,
  mergedColumnInfo?: any[],
) => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(data);

  const isHasSubColumn = mergedColumnInfo && mergedColumnInfo?.length > 0;
  if (isHasSubColumn) {
    worksheet["!merges"] = mergedColumnInfo;
  }

  // Calculate the maximum width for each column
  const maxWidths = data[0].map((item: any, colIndex: number) => {
    return Math.max(
      ...data.map((row) =>
        row[colIndex] ? row[colIndex].toString().length : 10,
      ),
    );
  });

  // Set the width for each column in the worksheet
  worksheet["!cols"] = maxWidths.map((width: number) => ({ wch: width }));
  xlsx.utils.book_append_sheet(workbook, worksheet, "MySheet");

  await xlsx.writeFile(workbook, fileName);
};

const searchWallet = (
  listWallet: IWallet[],
  encryptKey: string,
  searchText: string,
): IWallet[] => {
  return listWallet?.filter((wallet: IWallet) => {
    wallet = decryptWallet(wallet, encryptKey);
    const phrase = wallet?.phrase;
    const address = wallet?.address;
    const privateKey = wallet?.privateKey;

    return (
      isSearchMatch(searchText, phrase) ||
      isSearchMatch(searchText, address) ||
      isSearchMatch(searchText, privateKey)
    );
  });
};

const searchProfile = (
  listProfile: IProfile[] | ICampaignProfile[],
  encryptKey: string,
  searchText: string,
): IProfile[] => {
  return listProfile?.filter((profile: IProfile) => {
    const isProfileInfoMatch =
      isSearchMatch(searchText, profile?.name) ||
      isSearchMatch(searchText, profile?.note);
    if (isProfileInfoMatch) {
      return true;
    }

    const wallet = profile?.wallet
      ? decryptWallet(profile?.wallet, encryptKey)
      : profile?.wallet;
    const isWalletMatch =
      isSearchMatch(searchText, wallet?.phrase) ||
      isSearchMatch(searchText, wallet?.address) ||
      isSearchMatch(searchText, wallet?.privateKey);
    if (isWalletMatch) {
      return true;
    }

    const listResource =
      profile?.listResource && profile?.listResource?.length > 0
        ? profile?.listResource?.map((resource: IResource) =>
            decryptResource(resource, encryptKey),
          )
        : profile?.listResource || [];

    let isResourceMatch = false;
    for (let i = 0; i < listResource?.length; i++) {
      const resource = listResource[i];
      if (
        isSearchMatch(searchText, resource?.col1) ||
        isSearchMatch(searchText, resource?.col2) ||
        isSearchMatch(searchText, resource?.col3) ||
        isSearchMatch(searchText, resource?.col4) ||
        isSearchMatch(searchText, resource?.col5) ||
        isSearchMatch(searchText, resource?.col6) ||
        isSearchMatch(searchText, resource?.col7) ||
        isSearchMatch(searchText, resource?.col8) ||
        isSearchMatch(searchText, resource?.col9) ||
        isSearchMatch(searchText, resource?.col10)
      ) {
        isResourceMatch = true;
        break;
      }
    }

    return isResourceMatch;
  });
};

const isSearchMatch = (searchText: string, text?: string): boolean => {
  if (!text && searchText) {
    return false;
  }
  searchText = searchText?.toLowerCase();
  text = text?.toString()?.toLowerCase();

  const formattedSearchText = removeSpecialCharacter(searchText);
  if (formattedSearchText !== searchText) {
    return searchText === text;
  }

  return text?.search(new RegExp(searchText, "g")) !== -1;
};

const removeSpecialCharacter = (inputString: string): string => {
  const specialCharsRegex = /[\\/,*^&$#@!()_+[\]{}|;:'"<>=?`~%]/g;
  const resultString = inputString.replace(specialCharsRegex, "");
  return resultString;
};

const sleep = async (millisecond: number) => {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
};

export {
  sleep,
  removeLastTrailingSlash,
  logEveryWhere,
  exportDataToExcel,
  searchWallet,
  searchProfile,
};
