import crypto from "crypto";

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 32; // 256 bits
const DIGEST = "sha256";
const VERIFY_PLAINTEXT = "keeper-agent-verify";

export class MasterPasswordManager {
  private masterPassword: Buffer | null = null;
  private salt: string = "";

  /*   
- Use email as salt to derive the master password, each user has a different salt. If a user changes their email, the master password will be invalidated.
- When user export data to other device, they use the same email, so the master password will be the same. 
*/
  setSalt(email: string): void {
    this.salt = email?.toLowerCase().trim() || "";
  }

  setMasterPassword(key: Buffer): void {
    this.clearMasterPassword();
    this.masterPassword = key;
  }

  getMasterPassword(): Buffer | null {
    return this.masterPassword ? Buffer.from(this.masterPassword) : null;
  }

  clearMasterPassword(): void {
    if (this.masterPassword) {
      this.masterPassword.fill(0);
    }
    this.masterPassword = null;
  }

  isMasterPasswordSet(): boolean {
    return this.masterPassword !== null;
  }

  /**
   * Create a verification token encrypted with the master key.
   * Store the returned string in the database.
   * Format: iv:authTag:ciphertext (all base64)
   */
  createVerifier = (key: Buffer): string => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(VERIFY_PLAINTEXT, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString("base64"),
      authTag.toString("base64"),
      encrypted.toString("base64"),
    ].join(":");
  };

  /**
   * Verify a password by deriving the key and decrypting the verifier.
   * Returns true if the password is correct.
   */
  verifyPassword = (password: string, verifier: string): boolean => {
    try {
      const passwordBuffer = this.derivePassword(password);
      const [ivB64, authTagB64, ciphertextB64] = verifier.split(":");
      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const ciphertext = Buffer.from(ciphertextB64, "base64");

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        passwordBuffer,
        iv,
      );
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      const expected = Buffer.from(VERIFY_PLAINTEXT, "utf8");
      if (decrypted.length !== expected.length) {
        return false;
      }
      return crypto.timingSafeEqual(decrypted, expected);
    } catch {
      return false;
    }
  };

  derivePassword = (password: string): Buffer => {
    return crypto.pbkdf2Sync(
      password,
      this.salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
    );
  };
}

export const masterPasswordManager = new MasterPasswordManager();
