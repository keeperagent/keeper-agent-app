import _ from "lodash";
import fs from "fs-extra";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { FILE_KEY, NUMBER_OF_COLUMN } from "@/electron/constant";
import { logEveryWhere, removeLastTrailingSlash } from "./util";
import { encryptionService } from "./encrypt";

export const exportResourceGroupConfig = async (
  resourceGroupId: number,
  folderPath: string,
  fileName: string,
): Promise<Error | null> => {
  try {
    const [resourceGroup, err] =
      await resourceGroupDB.getOneResourceGroup(resourceGroupId);
    if (err) {
      return err;
    }
    if (!resourceGroup) {
      return new Error("ResourceGroup not found");
    }

    const columnKeys = Array.from({ length: NUMBER_OF_COLUMN }, (_, i) => {
      const num = i + 1;
      return [`col${num}Variable`, `col${num}Label`, `col${num}IsEncrypt`];
    }).flat();
    const configInfo = _.pick(resourceGroup, columnKeys);
    const fileData = JSON.stringify(configInfo);
    const encryptedData = encryptionService.encryptData(fileData, FILE_KEY);
    await fs.writeFile(
      `${removeLastTrailingSlash(folderPath)}/${`${fileName}.txt`}`,
      encryptedData,
    );
    return null;
  } catch (err: any) {
    logEveryWhere({
      message: `exportResourceGroupConfig() error: ${err?.message}`,
    });
    return err;
  }
};

export const importResourceGroupConfig = async (
  resourceGroupId: number,
  filePath: string,
): Promise<Error | null> => {
  try {
    const encryptedData = await fs.readFile(filePath, "utf8");
    const decryptedData = encryptionService.decryptData(
      encryptedData,
      FILE_KEY,
    );
    const configInfo = JSON.parse(decryptedData);
    const resourceGroup = {
      id: resourceGroupId,
      ...configInfo,
    };

    const [, errUpdate] =
      await resourceGroupDB.updateResourceGroup(resourceGroup);
    return errUpdate;
  } catch (err: any) {
    logEveryWhere({
      message: `importResourceGroupConfig() error: ${err?.message}`,
    });
    return err;
  }
};
