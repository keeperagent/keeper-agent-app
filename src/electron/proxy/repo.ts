export interface IProxyProvider {
  getAProxy(
    profileKey: string,
    maxProfilePerProxy: number,
    campaignId: number,
    workflowId: number,
  ): Promise<IProxyRes>;
  markProxyIsUnUsed(profileKey: string): void;
  isApiKeyAlive(apiKey: string): Promise<boolean>;
  startProxyProvider(campaignId: number, workflowId: number): Promise<void>;
  stopProxyProvider(): void;
}

export interface IProxyClient {
  buildProxyInfo(apiKey: string, sessionId: string): IProxyInfo;
  isApiKeyAlive(apiKey: string): Promise<boolean>;
}

export interface IProxyInfo {
  protocol: string;
  ip: string;
  port: number;
  username?: string;
  password?: string;
  sessionId?: string;
}

export interface IProxyRes {
  proxy: IProxyInfo | null;
  error: string | null;
}

export interface APIKeyConfig {
  value: string;
}
