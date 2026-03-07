import { app, safeStorage } from "electron";
import fs from "fs";
import path from "path";

// auth.bin  → encrypted via safeStorage (macOS/Windows always, Linux if keychain available)
// auth.json → plain JSON fallback when encryption is unavailable (e.g. headless Linux)
const ENCRYPTED_FILE_NAME = "auth.bin";
const PLAIN_FILE_NAME = "auth.json";

const getFilePath = (name: string): string =>
  path.join(app.getPath("userData"), name);

type IStoredAuth = {
  token: string;
  user: any;
};

export const saveAuth = (token: string, user: any): void => {
  try {
    const payload = JSON.stringify({ token, user });

    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(payload);
      fs.writeFileSync(getFilePath(ENCRYPTED_FILE_NAME), encrypted);
    } else {
      fs.writeFileSync(getFilePath(PLAIN_FILE_NAME), payload, "utf-8");
    }
  } catch {}
};

export const loadAuth = (): IStoredAuth | null => {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const filePath = getFilePath(ENCRYPTED_FILE_NAME);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const decrypted = safeStorage.decryptString(fs.readFileSync(filePath));
      return JSON.parse(decrypted);
    } else {
      const filePath = getFilePath(PLAIN_FILE_NAME);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {
    return null;
  }
};

export const clearAuth = (): void => {
  try {
    for (const name of [ENCRYPTED_FILE_NAME, PLAIN_FILE_NAME]) {
      const filePath = getFilePath(name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {}
};
