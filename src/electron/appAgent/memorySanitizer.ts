// Tool names whose presence in a memory line signals a behavioral injection attempt.
const DANGEROUS_TOOL_NAMES = [
  "execute_javascript",
  "run_workflow",
  "broadcast_transaction",
  "swap_on_jupiter",
  "swap_on_kyberswap",
  "transfer_solana_token",
  "launch_pumpfun_token",
  "launch_bonkfun_token",
];

// Phrases that indicate an attempt to override the agent's instructions via memory.
const INJECTION_PHRASES = [
  /ignore\s+previous\s+instructions/i,
  /override\s+(your|the)\s+(system|rules|instructions|prompt)/i,
  /you\s+(must|should|will)\s+now\b/i,
  /from\s+now\s+on,?\s+(always|never|when)/i,
  /new\s+instruction/i,
  /disregard\s+(all|your|previous)/i,
];

// Remove dangerous content from memory before it is written to disk.
export const sanitizeMemoryContent = (content: string): string =>
  content
    .split("\n")
    .filter((line) => {
      const lower = line.toLowerCase();
      if (DANGEROUS_TOOL_NAMES.some((tool) => lower.includes(tool))) {
        return false;
      }
      if (INJECTION_PHRASES.some((pattern) => pattern.test(line))) {
        return false;
      }
      return true;
    })
    .join("\n");
