/**
 * Module-level singleton store for pending (approved) code.
 *
 * Using a module-level Map instead of toolContext ensures the store is shared
 * across all agent contexts (main agent + subagents) in the same Node.js process,
 * regardless of how deepagents invokes subagents.
 */

export interface IPendingCode {
  language: "javascript" | "python";
  code: string;
}

const pendingCodeByAgentId = new Map<string, IPendingCode>();

export const storePendingCode = (
  agentId: string,
  pendingCode: IPendingCode,
): void => {
  pendingCodeByAgentId.set(agentId, pendingCode);
};

export const loadPendingCode = (agentId: string): IPendingCode | undefined => {
  return pendingCodeByAgentId.get(agentId);
};

export const removePendingCode = (agentId: string): void => {
  pendingCodeByAgentId.delete(agentId);
};
