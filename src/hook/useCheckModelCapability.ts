import { useCallback, useState } from "react";
import { uid } from "uid";
import { MESSAGE } from "@/electron/constant";
import { LLMProvider } from "@/electron/type";
import { sleep } from "@/service/util";
import type { IModelCapability } from "@/electron/service/modelCapability";

const capabilityCache = new Map<string, boolean>();

const useCheckModelCapability = () => {
  const [modelCapability, setModelCapability] =
    useState<IModelCapability | null>(null);

  const checkModelCapability = useCallback(
    async (
      modelName: string,
      provider: LLMProvider,
    ): Promise<IModelCapability> => {
      if (!modelName) {
        const result = { supportsVision: false };
        setModelCapability(result);
        return result;
      }
      if (capabilityCache.has(modelName)) {
        const result = { supportsVision: capabilityCache.get(modelName)! };
        setModelCapability(result);
        return result;
      }
      if (!window?.electron) {
        const result = { supportsVision: true };
        setModelCapability(result);
        return result;
      }

      const requestId = uid(25);
      let isDone = false;
      let result: IModelCapability = { supportsVision: false };

      await new Promise(async (resolve) => {
        window?.electron?.on(
          MESSAGE.CHECK_MODEL_CAPABILITY_RES,
          (_event: any, payload: any) => {
            if (payload?.requestId !== requestId) {
              return;
            }
            result = payload?.data || { supportsVision: false };
            isDone = true;
          },
        );

        window.electron.send(MESSAGE.CHECK_MODEL_CAPABILITY, {
          modelName,
          provider,
          requestId,
        });

        while (!isDone) {
          await sleep(10);
        }

        window?.electron?.removeAllListeners(
          MESSAGE.CHECK_MODEL_CAPABILITY_RES,
        );
        resolve(true);
      });

      capabilityCache.set(modelName, result.supportsVision);
      setModelCapability(result);
      return result;
    },
    [],
  );

  return { checkModelCapability, modelCapability };
};

export { useCheckModelCapability };
