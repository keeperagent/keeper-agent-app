import crypto from "crypto";
import { MasterPasswordManager, masterPasswordManager } from "./masterPassword";

const SECRET_KEY_ITERATIONS = 500_000;
const SECRET_KEY_SALT = "keeper-agent-encrypt";

export class EncryptionService {
  private encryptKeyCache = new Map<string, Buffer>();
  private masterPasswordManager: MasterPasswordManager;

  constructor(masterPasswordManager: MasterPasswordManager) {
    this.masterPasswordManager = masterPasswordManager;
  }

  /**
   * AES-256-GCM encrypt. Returns "iv:authTag:ciphertext" (base64).
   */
  private encryptWithKey(data: string, encryptKey: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(data, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString("base64"),
      authTag.toString("base64"),
      encrypted.toString("base64"),
    ].join(":");
  }

  /**
   * AES-256-GCM decrypt. Input format: "iv:authTag:ciphertext" (base64).
   * Returns empty string on failure.
   */
  private decryptWithKey(data: string, encryptKey: Buffer): string {
    try {
      const [ivB64, authTagB64, ciphertextB64] = data.split(":");
      if (!ivB64 || !authTagB64 || !ciphertextB64) {
        return "";
      }

      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const ciphertext = Buffer.from(ciphertextB64, "base64");

      const decipher = crypto.createDecipheriv("aes-256-gcm", encryptKey, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return decrypted.toString("utf8");
    } catch {
      return "";
    }
  }

  /**
   * Derive a 256-bit key from a secret string using PBKDF2.
   * Results are cached in memory for performance.
   */
  private deriveEncryptKey(secret: string): Buffer {
    const cached = this.encryptKeyCache.get(secret);
    if (cached) {
      return cached;
    }

    const encryptKey = crypto.pbkdf2Sync(
      secret,
      SECRET_KEY_SALT,
      SECRET_KEY_ITERATIONS,
      32,
      "sha256",
    );
    this.encryptKeyCache.set(secret, encryptKey);
    return encryptKey;
  }

  /**
   * Encrypt data using master password or a provided secret.
   */
  encryptData(data: any, secret?: string): string {
    try {
      const encryptKey = secret
        ? this.deriveEncryptKey(secret)
        : this.masterPasswordManager.getMasterPassword();
      if (!encryptKey) {
        return "";
      }
      return this.encryptWithKey(String(data), encryptKey);
    } catch {
      return "";
    }
  }

  /**
   * Decrypt data using master password or a provided secret.
   */
  decryptData(data: any, secret?: string): string {
    try {
      const encryptKey = secret
        ? this.deriveEncryptKey(secret)
        : this.masterPasswordManager.getMasterPassword();

      if (!encryptKey) {
        return "";
      }
      return this.decryptWithKey(String(data), encryptKey);
    } catch {
      return "";
    }
  }
}

export const encryptionService = new EncryptionService(masterPasswordManager);
