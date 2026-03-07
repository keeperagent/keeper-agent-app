import _ from "lodash";
import fs from "fs-extra";
import { workflowDB } from "@/electron/database/workflow";
import { IWorkflow } from "@/electron/type";
import { FILE_KEY } from "@/electron/constant";
import { removeLastTrailingSlash, logEveryWhere } from "./util";
import { encryptionService } from "./encrypt";

const exportWorkflow = async (params: {
  listWorkflowId: number[];
  folderPath: string;
  fileName: string;
}): Promise<Error | null> => {
  const { listWorkflowId, folderPath, fileName } = params;
  try {
    if (!listWorkflowId || listWorkflowId?.length === 0) {
      return Error("@listWorkflowId is empty");
    }
    if (!folderPath) {
      return Error("@folderPath is empty");
    }

    const [res, err] = await workflowDB.getListWorkflowById(listWorkflowId);
    if (err) {
      return err;
    }

    const listWorkflowInfo = res?.map((workflow: IWorkflow) =>
      _.pick(workflow, ["name", "note", "data"]),
    );
    const fileData = JSON.stringify(listWorkflowInfo);
    const encryptedData = encryptionService.encryptData(fileData, FILE_KEY);
    await fs.writeFile(
      `${removeLastTrailingSlash(folderPath)}/${`${fileName}.txt`}`,
      encryptedData,
    );

    return null;
  } catch (err: any) {
    logEveryWhere({ message: `exportWorkflow() error: ${err?.message}` });
    return err;
  }
};

const importWorkflow = async (
  listFilePath: string[],
): Promise<Error | null> => {
  try {
    for (let i = 0; i < listFilePath.length; i++) {
      try {
        const encryptedData = await fs.readFile(listFilePath[i], "utf8");
        const decryptedData = encryptionService.decryptData(
          encryptedData,
          FILE_KEY,
        );
        const listWorkflowInfo = JSON.parse(decryptedData);
        await workflowDB.createBulkWorkflow(listWorkflowInfo);
      } catch {}
    }

    return null;
  } catch (err: any) {
    logEveryWhere({ message: `importWorkflow() error: ${err?.message}` });
    return err;
  }
};

export { exportWorkflow, importWorkflow };
