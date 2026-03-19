import _ from "lodash";
import fs from "fs-extra";
import { logEveryWhere, removeLastTrailingSlash } from "./util";
import { encryptionService } from "./encrypt";
import { campaignDB } from "@/electron/database/campaign";
import { FILE_KEY, NUMBER_OF_COLUMN } from "@/electron/constant";

export const exportCampaignConfig = async (
  campaignId: number,
  folderPath: string,
  fileName: string,
): Promise<Error | null> => {
  try {
    const [campaign, err] = await campaignDB.getOneCampaign(campaignId);
    if (err) {
      return err;
    }
    if (!campaign) {
      return new Error("Campaign not found");
    }

    const columnKeys = Array.from({ length: NUMBER_OF_COLUMN }, (_, i) => {
      const num = i + 1;
      return [`col${num}Variable`, `col${num}Label`];
    }).flat();
    const campaignInfo = _.pick(campaign, [
      ...columnKeys,
      "sortField",
      "sortOrder",
    ]);
    const fileData = JSON.stringify(campaignInfo);
    const encryptedData = encryptionService.encryptData(fileData, FILE_KEY);
    await fs.writeFile(
      `${removeLastTrailingSlash(folderPath)}/${`${fileName}.txt`}`,
      encryptedData,
    );
    return null;
  } catch (err: any) {
    logEveryWhere({ message: `exportCampaignConfig() error: ${err?.message}` });
    return err;
  }
};

export const importCampaignConfig = async (
  campaignId: number,
  filePath: string,
): Promise<Error | null> => {
  try {
    const encryptedData = await fs.readFile(filePath, "utf8");
    const decryptedData = encryptionService.decryptData(
      encryptedData,
      FILE_KEY,
    );
    const campaignInfo = JSON.parse(decryptedData);
    const campaign = {
      id: campaignId,
      ...campaignInfo,
    };

    const [, errUpdate] = await campaignDB.updateCampaign(campaign!);
    return errUpdate;
  } catch (err: any) {
    logEveryWhere({ message: `importCampaignConfig() error: ${err?.message}` });
    return err;
  }
};
