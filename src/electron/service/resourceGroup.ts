import _ from "lodash";
import fs from "fs-extra";
import { logEveryWhere, removeLastTrailingSlash } from "./util";
import { encryptionService } from "./encrypt";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { FILE_KEY } from "@/electron/constant";

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

    const configInfo = _.pick(resourceGroup, [
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
      "col1IsEncrypt",
      "col2IsEncrypt",
      "col3IsEncrypt",
      "col4IsEncrypt",
      "col5IsEncrypt",
      "col6IsEncrypt",
      "col7IsEncrypt",
      "col8IsEncrypt",
      "col9IsEncrypt",
      "col10IsEncrypt",
    ]);
    const fileData = JSON.stringify(configInfo);
    const encryptedData = encryptionService.encryptData(fileData, FILE_KEY);
    await fs.writeFile(
      `${removeLastTrailingSlash(folderPath)}/${`${fileName}.txt`}`,
      encryptedData,
    );
    return null;
  } catch (err: any) {
    logEveryWhere({ message: `exportResourceGroupConfig() error: ${err?.message}` });
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
    logEveryWhere({ message: `importResourceGroupConfig() error: ${err?.message}` });
    return err;
  }
};
