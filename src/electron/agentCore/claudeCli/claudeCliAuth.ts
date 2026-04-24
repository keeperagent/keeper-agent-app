import { execSync } from "child_process";
import { app } from "electron";
import os from "os";
import path from "path";
import fs from "fs";
import { logEveryWhere } from "@/electron/service/util";

export type ClaudeCliConfig = {
  keychainService: string;
  clientId: string;
  tokenUrl: string;
  scopes: string[];
  cliVersion: string;
  billingSalt: string;
  systemIdentity: string;
  billingPrefix: string;
  toolPrefix: string;
  baseBetas: string[];
  modelOverrides: Record<string, { exclude?: string[]; add?: string[] }>;
};

type ClaudeOAuthCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clientId?: string;
};

const DEFAULT_CONFIG: ClaudeCliConfig = {
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
  cliVersion: "2.1.119",
  billingSalt: "59cf53e54c78",
  systemIdentity: "You are Claude Code, Anthropic's official CLI for Claude.",
  billingPrefix: "x-anthropic-billing-header",
  toolPrefix: "mcp_",
  baseBetas: [
    "claude-code-20250219",
    "oauth-2025-04-20",
    "interleaved-thinking-2025-05-14",
    "prompt-caching-scope-2026-01-05",
    "context-management-2025-06-27",
  ],
  modelOverrides: {
    haiku: { exclude: ["interleaved-thinking-2025-05-14"] },
    "4-6": { add: ["effort-2025-11-24"] },
    "4-7": { add: ["effort-2025-11-24"] },
  },
};

class ClaudeCliAuth {
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

  loadConfig = (): ClaudeCliConfig => {
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
        clientId: oauthData.clientId,
      };
    } catch {
      return null;
    }
  };

  private readCredentialsFile = (): ClaudeOAuthCredentials | null => {
    try {
      const credentialsPath = path.join(
        os.homedir(),
        ".claude",
        ".credentials.json",
      );
      if (!fs.existsSync(credentialsPath)) {
        return null;
      }
      const raw = fs.readFileSync(credentialsPath, "utf-8");
      const parsed = JSON.parse(raw);
      const oauthData = parsed?.claudeAiOauth;
      if (!oauthData?.accessToken) {
        return null;
      }
      return {
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken,
        expiresAt: oauthData.expiresAt,
        clientId: oauthData.clientId,
      };
    } catch {
      return null;
    }
  };

  private readCredentials = (
    keychainService: string,
  ): ClaudeOAuthCredentials | null => {
    return (
      this.readKeychainCredentials(keychainService) ||
      this.readCredentialsFile()
    );
  };

  private refreshAccessToken = async (
    refreshToken: string,
    config: ClaudeCliConfig,
    storedClientId?: string,
  ): Promise<ClaudeOAuthCredentials | null> => {
    try {
      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: storedClientId || config.clientId,
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
    const credentials = this.readCredentials(config.keychainService);
    if (!credentials) {
      throw new Error(
        "Claude CLI credentials not found. Please run: claude auth login",
      );
    }

    const isExpiringSoon = credentials.expiresAt - Date.now() < cacheTime;
    if (!isExpiringSoon) {
      logEveryWhere({
        message: `claudeCliAuth: token loaded from keychain, accessToken: ${credentials.accessToken}, expiresAt: ${credentials.expiresAt}`,
      });
      this.cachedToken = {
        accessToken: credentials.accessToken,
        expiresAt: credentials.expiresAt,
      };
      return credentials.accessToken;
    }

    const refreshed = await this.refreshAccessToken(
      credentials.refreshToken,
      config,
      credentials.clientId,
    );
    if (refreshed) {
      logEveryWhere({ message: "claudeCliAuth: token refreshed successfully" });
      this.cachedToken = {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      };
      return refreshed.accessToken;
    }

    logEveryWhere({
      message: "claudeCliAuth: token refresh failed, using existing token",
    });
    this.cachedToken = {
      accessToken: credentials.accessToken,
      expiresAt: credentials.expiresAt,
    };
    return credentials.accessToken;
  };

  isAvailable = (): boolean => {
    const config = this.loadConfig();
    const credentials = this.readCredentials(config.keychainService);
    return credentials !== null;
  };
}

const claudeCliAuth = new ClaudeCliAuth();
export { claudeCliAuth };
