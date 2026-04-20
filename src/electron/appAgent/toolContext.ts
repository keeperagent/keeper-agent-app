export interface IAttachedFileContext {
  name?: string;
  filePath: string;
  type?: string;
  extension?: string;
}

export enum PlanState {
  DRAFTED = "drafted",
  APPROVED = "approved",
}

export interface IPendingCode {
  language: "javascript";
  code: string;
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
  llmProvider?: string;
  planState?: PlanState;
  approvedPlan?: string;
  requestPlanApproval?: (plan: string) => Promise<boolean>;
  // Set for registry agents so mailbox tools know the sender ID. Undefined for the main agent
  agentProfileId?: number;
  // Code written by write_javascript, consumed by execute_javascript
  pendingCode?: IPendingCode;
  // Active todo step type — drives tool scoping in StepScopingMiddleware
  currentStepType?: string | null;
  // Called by StepScopingMiddleware when a task auto-advances a todo step to completed
  onStepAdvanced?: (stepContent: string, todos: any[]) => void;
  // Called by bridge.ts at the start of each run to reset cross-turn middleware state
  resetStepState?: () => void;
  // Called by StepScopingMiddleware when all todo steps are completed
  onAllDone?: (todos: any[]) => void;
  // Experience hint injected once into the first model call of a run
  experienceHint?: string | null;
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
    if (data.llmProvider !== undefined) {
      this.data.llmProvider = data.llmProvider;
    }
    if (data.planState !== undefined) {
      this.data.planState = data.planState;
    }
    if (data.approvedPlan !== undefined) {
      this.data.approvedPlan = data.approvedPlan;
    }
    if (data.requestPlanApproval !== undefined) {
      this.data.requestPlanApproval = data.requestPlanApproval;
    }
    if (data.agentProfileId !== undefined) {
      this.data.agentProfileId = data.agentProfileId;
    }
    if (data.pendingCode !== undefined) {
      this.data.pendingCode = data.pendingCode;
    }
    if ("currentStepType" in data) {
      this.data.currentStepType = data.currentStepType;
    }
    if ("onStepAdvanced" in data) {
      this.data.onStepAdvanced = data.onStepAdvanced;
    }
    if ("resetStepState" in data) {
      this.data.resetStepState = data.resetStepState;
    }
    if ("onAllDone" in data) {
      this.data.onAllDone = data.onAllDone;
    }
    if ("experienceHint" in data) {
      this.data.experienceHint = data.experienceHint;
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

  get llmProvider(): string | undefined {
    return this.data.llmProvider;
  }

  get planState(): PlanState | undefined {
    return this.data.planState;
  }

  resetPlanState(): void {
    this.data.planState = undefined;
    this.data.approvedPlan = undefined;
  }

  get approvedPlan(): string | undefined {
    return this.data.approvedPlan;
  }

  get requestPlanApproval(): ((plan: string) => Promise<boolean>) | undefined {
    return this.data.requestPlanApproval;
  }

  get agentProfileId(): number | undefined {
    return this.data.agentProfileId;
  }

  get pendingCode(): IPendingCode | undefined {
    return this.data.pendingCode;
  }

  clearPendingCode(): void {
    this.data.pendingCode = undefined;
  }

  get currentStepType(): string | null | undefined {
    return this.data.currentStepType;
  }

  get onStepAdvanced():
    | ((stepContent: string, todos: any[]) => void)
    | undefined {
    return this.data.onStepAdvanced;
  }

  get resetStepState(): (() => void) | undefined {
    return this.data.resetStepState;
  }

  get onAllDone(): ((todos: any[]) => void) | undefined {
    return this.data.onAllDone;
  }

  get experienceHint(): string | null | undefined {
    return this.data.experienceHint;
  }
}
