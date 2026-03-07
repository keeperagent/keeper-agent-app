import _ from "lodash";
import fs from "fs-extra";
import { logEveryWhere, removeLastTrailingSlash } from "./util";
import { encryptionService } from "./encrypt";
import { campaignDB } from "@/electron/database/campaign";
import { FILE_KEY } from "@/electron/constant";

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

    const campaignInfo = _.pick(campaign, [
      "col1Variable",
      "col2Variable",
      "col3Variable",
      "col4Variable",
      "col5Variable",
      "col6Variable",
      "col7Variable",
      "col8Variable",
      "col9Variable",
      "col10Variable",
      "col1Label",
      "col2Label",
      "col3Label",
      "col4Label",
      "col5Label",
      "col6Label",
      "col7Label",
      "col8Label",
      "col9Label",
      "col10Label",
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
