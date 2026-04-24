import { app } from "electron";
import os from "os";
import path from "path";
import fs from "fs";
import { logEveryWhere } from "@/electron/service/util";

export type CodexCliConfig = {
  authPath: string;
  clientId: string;
  tokenUrl: string;
  defaultModel: string;
  originator: string;
};

type CodexTokens = {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  account_id?: string;
};

type CodexAuthFile = {
  auth_mode: string;
  tokens?: CodexTokens;
  last_refresh?: string;
};

const DEFAULT_CONFIG: CodexCliConfig = {
  authPath: path.join(os.homedir(), ".codex", "auth.json"),
  clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
  tokenUrl: "https://auth.openai.com/oauth/token",
  defaultModel: "gpt-5.4-mini",
  originator: "codex_cli_rs",
};

const TOKEN_EXPIRY_BUFFER_MS = 120 * 1000;

class CodexCliAuth {
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

  loadConfig = (): CodexCliConfig => {
    try {
      const configPath = path.join(
        app.getPath("userData"),
        "model-capability.json",
      );
      if (!fs.existsSync(configPath)) {
        return DEFAULT_CONFIG;
      }

      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.codexCLIConfig) {
        const updated = { ...parsed, codexCLIConfig: DEFAULT_CONFIG };
        fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf-8");
        return DEFAULT_CONFIG;
      }

      return { ...DEFAULT_CONFIG, ...parsed.codexCLIConfig };
    } catch {
      return DEFAULT_CONFIG;
    }
  };

  getAccessToken = async (): Promise<string> => {
    if (
      this.cachedToken &&
      this.cachedToken.expiresAt - Date.now() > TOKEN_EXPIRY_BUFFER_MS
    ) {
      return this.cachedToken.accessToken;
    }

    const config = this.loadConfig();
    const authFile = this.readAuthFile(config.authPath);
    if (!authFile || !authFile.tokens) {
      throw new Error(
        "Codex CLI credentials not found. Please run: codex auth login",
      );
    }

    const { access_token, refresh_token } = authFile.tokens;
    const expiresAt = this.parseJwtExpiry(access_token);
    const isExpiringSoon =
      expiresAt > 0 && expiresAt - Date.now() < TOKEN_EXPIRY_BUFFER_MS;

    if (!isExpiringSoon) {
      const tokenExpiry = expiresAt || Date.now() + 3600 * 1000;
      logEveryWhere({
        message: `codexCliAuth: token loaded from auth.json, accessToken: ${access_token}, expiresAt: ${tokenExpiry}`,
      });
      this.cachedToken = { accessToken: access_token, expiresAt: tokenExpiry };
      return access_token;
    }

    if (refresh_token) {
      const refreshed = await this.refreshAccessToken(refresh_token, config);
      if (refreshed) {
        logEveryWhere({
          message: "codexCliAuth: token refreshed successfully",
        });
        this.cachedToken = refreshed;
        return refreshed.accessToken;
      }
    }

    logEveryWhere({
      message: "codexCliAuth: token refresh failed, using existing token",
    });
    const fallbackExpiry = expiresAt || Date.now() + 3600 * 1000;
    this.cachedToken = { accessToken: access_token, expiresAt: fallbackExpiry };
    return access_token;
  };

  isAvailable = (): boolean => {
    const config = this.loadConfig();
    return this.readAuthFile(config.authPath) !== null;
  };

  private readAuthFile = (authPath: string): CodexAuthFile | null => {
    try {
      if (!fs.existsSync(authPath)) {
        return null;
      }
      const raw = fs.readFileSync(authPath, "utf-8");
      const parsed = JSON.parse(raw) as CodexAuthFile;
      if (parsed.auth_mode !== "chatgpt" || !parsed.tokens?.access_token) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  private writeAuthFile = (authPath: string, updated: CodexAuthFile): void => {
    try {
      fs.writeFileSync(authPath, JSON.stringify(updated, null, 2), "utf-8");
    } catch {}
  };

  private refreshAccessToken = async (
    refreshToken: string,
    config: CodexCliConfig,
  ): Promise<{ accessToken: string; expiresAt: number } | null> => {
    try {
      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: config.clientId,
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as any;
      if (!data.access_token) {
        return null;
      }

      const expiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;

      const authFile = this.readAuthFile(config.authPath);
      if (authFile) {
        authFile.tokens = {
          ...authFile.tokens,
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          id_token: data.id_token || authFile.tokens?.id_token,
        };
        authFile.last_refresh = new Date().toISOString();
        this.writeAuthFile(config.authPath, authFile);
      }

      return { accessToken: data.access_token, expiresAt };
    } catch {
      return null;
    }
  };

  private parseJwtExpiry = (token: string): number => {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf-8"),
      );
      return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    } catch {
      return 0;
    }
  };
}

const codexCliAuth = new CodexCliAuth();
export { codexCliAuth };
