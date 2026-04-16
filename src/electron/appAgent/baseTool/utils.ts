import { app } from "electron";
import { spawn } from "child_process";
import path from "path";
import { KA_WORKSPACE_FOLDER } from "@/electron/constant";

// Patterns that indicate code is trying to access sensitive files outside the sandbox.
// These are blocked regardless of how the path is constructed.
const BLOCKED_CODE_PATTERNS = [
  /ka_app\.db/i,
  /ka_profile/i,
  /auth\.bin/i,
  /ka_browser/i,
  /ka_extension/i,
];

export const containsSensitivePath = (code: string): boolean =>
  BLOCKED_CODE_PATTERNS.some((pattern) => pattern.test(code));

export const getWorkspaceRoot = () =>
  path.join(app.getPath("userData"), KA_WORKSPACE_FOLDER);

export const killProcessTree = (pid: number) => {
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/F", "/T", "/PID", String(pid)]);
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch (_) {}
};

export const spawnWithTimeout = (
  command: string,
  args: string[],
  options: { timeout: number; cwd: string; env?: NodeJS.ProcessEnv },
): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      detached: process.platform !== "win32",
    });

    let stdout = "";
    let stderr = "";
    const MAX_BUFFER = 1024 * 1024;
    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_BUFFER) {
        stdout += chunk;
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_BUFFER) {
        stderr += chunk;
      }
    });

    const timer = setTimeout(() => {
      killProcessTree(child.pid!);
      reject(new Error("Process timed out"));
    }, options.timeout);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(new Error(stderr.trim() || `Process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

const SAFE_ENV_KEYS = ["PATH"];

export const buildSafeEnv = async (
  _workspaceRoot: string,
  extras: Record<string, string>,
): Promise<NodeJS.ProcessEnv> => {
  const safeEnv: NodeJS.ProcessEnv = {};
  for (const key of SAFE_ENV_KEYS) {
    if (process.env[key]) {
      safeEnv[key] = process.env[key];
    }
  }
  return { ...safeEnv, ...extras };
};

// Helper function to capitalize first letter of chain name
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Redistributes planned amounts across wallets while respecting available capacity.
 * Ensures the total matches targetTotal by proportionally filling remaining capacity.
 *
 * @param planned - Array of planned amounts per wallet
 * @param available - Array of available capacity per wallet
 * @param targetTotal - Target total amount to distribute
 * @returns Array of final amounts per wallet, respecting capacity constraints
 */
export const redistributeToCapacity = (
  planned: number[],
  available: number[],
  targetTotal: number,
): number[] => {
  // Initial clamp to capacity.
  let effective = planned.map((amt, idx) =>
    Math.min(Math.max(amt, 0), Math.max(available[idx], 0)),
  );
  const current = effective.reduce((a, b) => a + b, 0);
  const deficit = Math.max(targetTotal - current, 0);
  if (deficit === 0) return effective;

  // Remaining capacity after clamp.
  const remaining = available.map((cap, idx) =>
    Math.max(cap - effective[idx], 0),
  );
  const remainingTotal = remaining.reduce((a, b) => a + b, 0);
  if (remainingTotal === 0) return effective;

  // Single proportional fill.
  effective = effective.map(
    (amt, idx) => amt + (remaining[idx] / remainingTotal) * deficit,
  );

  // Final clamp to eliminate any floating-point overshoot.
  const filledTotal = effective.reduce((a, b) => a + b, 0);
  const eps = 1e-12;
  if (filledTotal > targetTotal + eps && filledTotal > 0) {
    const scale = targetTotal / filledTotal;
    effective = effective.map((v) => v * scale);
  }

  // Final clamp to ensure we don't exceed available capacity
  effective = effective.map((amt, idx) =>
    Math.min(amt, Math.max(available[idx], 0)),
  );

  // CRITICAL: After clamping to capacity, ensure total doesn't exceed targetTotal
  // This can happen if available capacities are large and clamping causes overshoot
  const finalTotal = effective.reduce((a, b) => a + b, 0);
  if (finalTotal > targetTotal + eps && finalTotal > 0) {
    const scale = targetTotal / finalTotal;
    effective = effective.map((v) => v * scale);
  }

  return effective;
};

/**
 * Extracts a detailed error message from various error types.
 * Handles Error objects, strings, and plain objects to avoid "[object Object]" messages.
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) return "Unknown error";

  // If it's already a string, return it
  if (typeof error === "string") return error;

  // If it's an Error object with a message property
  if (error instanceof Error) return error.message;

  // If it has a message property
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  // If it has a toString method, try it (but check if it's not just "[object Object]")
  if (typeof error?.toString === "function") {
    const str = error.toString();
    if (str && str !== "[object Object]") return str;
  }

  // Try to stringify the error object to get details
  try {
    const stringified = JSON.stringify(
      error,
      Object.getOwnPropertyNames(error),
    );
    if (stringified && stringified !== "{}" && stringified !== "null") {
      return stringified;
    }
  } catch {
    // If stringification fails, continue to fallback
  }

  // If it has nested error properties, try to extract them
  if (error?.error) {
    const nestedError = extractErrorMessage(error.error);
    if (nestedError !== "Unknown error") return nestedError;
  }

  // Try common error properties
  if (error?.reason && typeof error.reason === "string") return error.reason;
  if (error?.code) return `Error code: ${error.code}`;
  if (error?.name) return `Error: ${error.name}`;

  // Last resort: return a generic message
  return "Unknown error occurred";
};
