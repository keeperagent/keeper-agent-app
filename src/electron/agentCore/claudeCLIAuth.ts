import { execSync } from "child_process";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { logEveryWhere } from "@/electron/service/util";

type ClaudeCLIConfig = {
  keychainService: string;
  clientId: string;
  tokenUrl: string;
  scopes: string[];
};

type ClaudeOAuthCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const DEFAULT_CONFIG: ClaudeCLIConfig = {
  keychainService: "Claude Code-credentials",
  clientId: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
  tokenUrl: "https://platform.claude.com/v1/oauth/token",
  scopes: [
    "user:profile",
    "user:inference",
    "user:sessions:claude_code",
    "user:mcp_servers",
    "user:file_upload",
  ],
};

class ClaudeCLIAuth {
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

  private loadConfig = (): ClaudeCLIConfig => {
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
      if (!parsed.claudeCLIConfig) {
        const updated = { ...parsed, claudeCLIConfig: DEFAULT_CONFIG };
        fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf-8");
        return DEFAULT_CONFIG;
      }

      return { ...DEFAULT_CONFIG, ...parsed.claudeCLIConfig };
    } catch {
      return DEFAULT_CONFIG;
    }
  };

  private readKeychainCredentials = (
    keychainService: string,
  ): ClaudeOAuthCredentials | null => {
    try {
      const raw = execSync(
        `security find-generic-password -s '${keychainService}' -w`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      ).trim();
      const parsed = JSON.parse(raw);
      const oauthData = parsed?.claudeAiOauth;
      if (!oauthData?.accessToken) {
        return null;
      }

      return {
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken,
        expiresAt: oauthData.expiresAt,
      };
    } catch {
      return null;
    }
  };

  private refreshAccessToken = async (
    refreshToken: string,
    config: ClaudeCLIConfig,
  ): Promise<ClaudeOAuthCredentials | null> => {
    try {
      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: config.clientId,
          scope: config.scopes.join(" "),
        }),
      });
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as any;
      if (!data.access_token) {
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + Number(data.expires_in) * 1000,
      };
    } catch {
      return null;
    }
  };

  getAccessToken = async (): Promise<string> => {
    const cacheTime = 120 * 1000;

    if (
      this.cachedToken &&
      this.cachedToken.expiresAt - Date.now() > cacheTime
    ) {
      return this.cachedToken.accessToken;
    }

    const config = this.loadConfig();
    const credentials = this.readKeychainCredentials(config.keychainService);
    if (!credentials) {
      throw new Error(
        "Claude CLI credentials not found. Please run: claude auth login",
      );
    }

    const isExpiringSoon = credentials.expiresAt - Date.now() < cacheTime;
    if (!isExpiringSoon) {
      logEveryWhere({ message: "claudeCLIAuth: token loaded from keychain" });
      this.cachedToken = {
        accessToken: credentials.accessToken,
        expiresAt: credentials.expiresAt,
      };
      return credentials.accessToken;
    }

    const refreshed = await this.refreshAccessToken(
      credentials.refreshToken,
      config,
    );
    if (refreshed) {
      logEveryWhere({ message: "claudeCLIAuth: token refreshed successfully" });
      this.cachedToken = {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      };
      return refreshed.accessToken;
    }

    logEveryWhere({
      message: "claudeCLIAuth: token refresh failed, using existing token",
    });
    this.cachedToken = {
      accessToken: credentials.accessToken,
      expiresAt: credentials.expiresAt,
    };
    return credentials.accessToken;
  };

  isAvailable = (): boolean => {
    const config = this.loadConfig();
    const credentials = this.readKeychainCredentials(config.keychainService);
    return credentials !== null;
  };
}

const claudeCLIAuth = new ClaudeCLIAuth();
export { claudeCLIAuth };
