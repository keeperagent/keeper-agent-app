export interface IAttachedFileContext {
  name?: string;
  filePath: string;
  type?: string;
  extension?: string;
}

interface IToolContextData {
  nodeEndpointGroupId?: number;
  encryptKey?: string;
  listCampaignProfileId?: number[];
  isAllWallet?: boolean;
  tokenAddress?: string;
  campaignId?: number;
  chainKey?: string;
  attachedFiles?: IAttachedFileContext[];
}

/**
 * Mutable context object shared by all tools within an agent session.
 * Updated by the controller before each agent run by parsing the context
 * JSON block from the user message. This ensures model-agnostic access to
 * session-level parameters (nodeEndpointGroupId, encryptKey) without relying
 * on the LLM to extract and forward them.
 */
export class ToolContext {
  private data: IToolContextData = {};
  private _secrets = new Map<string, string>();

  get secrets(): Map<string, string> {
    return this._secrets;
  }

  mergeSecrets(newSecrets: Map<string, string>): void {
    for (const [token, value] of newSecrets) {
      this._secrets.set(token, value);
    }
  }

  clearSecrets(): void {
    this._secrets.clear();
  }

  update(data: Partial<IToolContextData>): void {
    if (data.nodeEndpointGroupId !== undefined) {
      this.data.nodeEndpointGroupId = data.nodeEndpointGroupId;
    }
    if (data.encryptKey !== undefined) {
      this.data.encryptKey = data.encryptKey;
    }
    if (data.listCampaignProfileId !== undefined) {
      this.data.listCampaignProfileId = data.listCampaignProfileId;
    }
    if (data.isAllWallet !== undefined) {
      this.data.isAllWallet = data.isAllWallet;
    }
    if (data.tokenAddress !== undefined) {
      this.data.tokenAddress = data.tokenAddress;
    }
    if (data.campaignId !== undefined) {
      this.data.campaignId = data.campaignId;
    }
    if (data.chainKey !== undefined) {
      this.data.chainKey = data.chainKey;
    }
    if (data.attachedFiles !== undefined) {
      this.data.attachedFiles = data.attachedFiles;
    }
  }

  get nodeEndpointGroupId(): number | undefined {
    return this.data.nodeEndpointGroupId;
  }

  get encryptKey(): string | undefined {
    return this.data.encryptKey;
  }

  get listCampaignProfileId(): number[] | undefined {
    return this.data.listCampaignProfileId;
  }

  get isAllWallet(): boolean | undefined {
    return this.data.isAllWallet;
  }

  get tokenAddress(): string | undefined {
    return this.data.tokenAddress;
  }

  get campaignId(): number | undefined {
    return this.data.campaignId;
  }

  get chainKey(): string | undefined {
    return this.data.chainKey;
  }

  get attachedFiles(): IAttachedFileContext[] | undefined {
    return this.data.attachedFiles;
  }
}
