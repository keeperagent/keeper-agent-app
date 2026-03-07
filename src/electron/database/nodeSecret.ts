import { NodeSecretModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";
import { encryptionService } from "@/electron/service/encrypt";

class NodeSecretDB {
  saveSecretKey = async (
    workflowId: number,
    nodeId: string,
    secretKey: string,
  ): Promise<Error | null> => {
    try {
      const now = new Date().getTime();
      await NodeSecretModel.upsert({
        workflowId,
        nodeId,
        secretKey: secretKey ? encryptionService.encryptData(secretKey) : "",
        createAt: now,
        updateAt: now,
      });
      return null;
    } catch (err: any) {
      logEveryWhere({ message: `nodeSecretDB.upsert() error: ${err?.message}` });
      return err;
    }
  };

  getSecretKey = async (
    workflowId: number,
    nodeId: string,
  ): Promise<string | null> => {
    try {
      const row: any = await NodeSecretModel.findOne({
        where: { workflowId, nodeId },
        raw: true,
      });
      if (!row?.secretKey) {
        return null;
      }
      return encryptionService.decryptData(row.secretKey) || null;
    } catch (err: any) {
      logEveryWhere({ message: `nodeSecretDB.getSecretKey() error: ${err?.message}` });
      return null;
    }
  };

  deleteByWorkflow = async (workflowId: number): Promise<Error | null> => {
    try {
      await NodeSecretModel.destroy({ where: { workflowId } });
      return null;
    } catch (err: any) {
      logEveryWhere({ message: `nodeSecretDB.deleteByWorkflow() error: ${err?.message}` });
      return err;
    }
  };
}

export const nodeSecretDB = new NodeSecretDB();
