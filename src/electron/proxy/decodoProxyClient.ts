import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { IProxyInfo, IProxyClient } from "./repo";
import { NETWORK_PROTOCOL } from "@/electron/constant";

const DECODO_PROXY_HOST = "gate.decodo.com";
const DECODO_PROXY_PORT = 7000;
const DECODO_TEST_URL = "https://ip.decodo.com/json";

const parseCredentials = (apiKey: string): { username: string; password: string } | null => {
  const idx = apiKey.indexOf(":");
  if (idx <= 0 || idx >= apiKey.length - 1) return null;
  return {
    username: apiKey.slice(0, idx),
    password: apiKey.slice(idx + 1),
  };
};

export class DecodoProxyClient implements IProxyClient {
  buildProxyInfo = (apiKey: string, sessionId: string): IProxyInfo => {
    const creds = parseCredentials(apiKey);
    if (!creds) {
      throw new Error("Invalid credentials format (expected username:password)");
    }
    return {
      protocol: NETWORK_PROTOCOL.HTTP,
      ip: DECODO_PROXY_HOST,
      port: DECODO_PROXY_PORT,
      username: `user-${creds.username}-session-${sessionId}`,
      password: creds.password,
      sessionId,
    };
  };

  isApiKeyAlive = async (apiKey: string): Promise<boolean> => {
    try {
      const creds = parseCredentials(apiKey);
      if (!creds) return false;
      const proxyUrl = `http://${encodeURIComponent(creds.username)}:${encodeURIComponent(creds.password)}@${DECODO_PROXY_HOST}:${DECODO_PROXY_PORT}`;
      const agent = new HttpsProxyAgent(proxyUrl);
      const res = await axios.get(DECODO_TEST_URL, {
        timeout: 10000,
        httpAgent: agent,
        httpsAgent: agent,
        validateStatus: () => true,
      });
      return res.status === 200;
    } catch {
      return false;
    }
  };
}
