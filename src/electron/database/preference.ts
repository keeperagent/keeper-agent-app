import _ from "lodash";
import { formatPreference } from "@/electron/service/formatData";
import { preferenceUniqueKey } from "@/electron/constant";
import { IPreference } from "@/electron/type";
import { PreferenceModel } from "./index";
import { logEveryWhere } from "@/electron/service/util";
import { encryptionService } from "@/electron/service/encrypt";

class PreferenceDB {
  async getOnePreference(): Promise<[IPreference | null, Error | null]> {
    try {
      const data = await PreferenceModel.findOne({
        where: { key: preferenceUniqueKey },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [formatPreference(data.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOnePreference() error: ${err?.message}` });
      return [null, err];
    }
  }

  // Raw read without decryption — used before master key is available
  async getOnePreferenceRaw(): Promise<[any | null, Error | null]> {
    try {
      const data = await PreferenceModel.findOne({
        where: { key: preferenceUniqueKey },
        raw: false,
      });
      if (!data) {
        return [null, null];
      }
      return [data.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOnePreferenceRaw() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async createPreference(
    preference: IPreference,
  ): Promise<[IPreference | null, Error | null]> {
    try {
      const data = await PreferenceModel.create(
        {
          ...preference,
          key: preferenceUniqueKey,
          nodeBlackList: JSON.stringify(preference?.nodeBlackList || []),
          disabledTools: JSON.stringify(preference?.disabledTools || []),
          jupiterApiKeys: encryptionService.encryptData(
            JSON.stringify(preference?.jupiterApiKeys || []),
          ),
          botTokenTelegram: preference?.botTokenTelegram
            ? encryptionService.encryptData(preference?.botTokenTelegram)
            : "",
          openAIApiKey: preference?.openAIApiKey
            ? encryptionService.encryptData(preference?.openAIApiKey)
            : "",
          anthropicApiKey: preference?.anthropicApiKey
            ? encryptionService.encryptData(preference?.anthropicApiKey)
            : "",
          googleGeminiApiKey: preference?.googleGeminiApiKey
            ? encryptionService.encryptData(preference?.googleGeminiApiKey)
            : "",
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        },
        { raw: false },
      );
      return [data?.toJSON(), null];
    } catch (err: any) {
      logEveryWhere({ message: `createPreference() error: ${err?.message}` });
      return [null, err];
    }
  }

  async updatePreference(
    preference: IPreference,
  ): Promise<[IPreference | null, Error | null]> {
    try {
      let updateData: any = {
        ...preference,
        updateAt: new Date().getTime(),
      };

      if (preference?.botTokenTelegram) {
        updateData = {
          ...updateData,
          botTokenTelegram: encryptionService.encryptData(
            preference?.botTokenTelegram,
          ),
        };
      }
      if (preference?.openAIApiKey) {
        updateData = {
          ...updateData,
          openAIApiKey: encryptionService.encryptData(preference?.openAIApiKey),
        };
      }
      if (preference?.anthropicApiKey) {
        updateData = {
          ...updateData,
          anthropicApiKey: encryptionService.encryptData(
            preference?.anthropicApiKey,
          ),
        };
      }
      if (preference?.googleGeminiApiKey) {
        updateData = {
          ...updateData,
          googleGeminiApiKey: encryptionService.encryptData(
            preference?.googleGeminiApiKey,
          ),
        };
      }

      if (preference?.nodeBlackList) {
        updateData = {
          ...updateData,
          nodeBlackList: JSON.stringify(preference?.nodeBlackList),
        };
      }

      if (preference?.jupiterApiKeys) {
        updateData = {
          ...updateData,
          jupiterApiKeys: encryptionService.encryptData(
            JSON.stringify(preference?.jupiterApiKeys),
          ),
        };
      }

      if (preference?.disabledTools) {
        updateData = {
          ...updateData,
          disabledTools: JSON.stringify(preference?.disabledTools),
        };
      }

      await PreferenceModel.update(_.omit(updateData, ["id"]), {
        where: { id: preference?.id },
      });

      return await this.getOnePreference();
    } catch (err: any) {
      logEveryWhere({ message: `updatePreference() error: ${err?.message}` });
      return [null, err];
    }
  }

  async deletePreference(
    listID: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const data = await PreferenceModel.destroy({ where: { id: listID } });
      return [data, null];
    } catch (err: any) {
      logEveryWhere({ message: `deletePreference() error: ${err?.message}` });
      return [null, err];
    }
  }

  /** Update only the master password verifier (used when changing master password). */
  async updateMasterPasswordVerifier(
    preferenceId: number,
    verifier: string,
  ): Promise<[boolean, Error | null]> {
    try {
      await PreferenceModel.update(
        { masterPasswordVerifier: verifier, updateAt: new Date().getTime() },
        { where: { id: preferenceId } },
      );
      return [true, null];
    } catch (err: any) {
      logEveryWhere({
        message: `updateMasterPasswordVerifier() error: ${err?.message}`,
      });
      return [false, err];
    }
  }
}

const preferenceDB = new PreferenceDB();
export { preferenceDB };
