import { app } from "electron";
import { spawn } from "child_process";
import path from "path";
import _ from "lodash";
import { PublicKey } from "@solana/web3.js";
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

export enum AmountStrategy {
  EQUAL_PER_WALLET = "EQUAL_PER_WALLET",
  RANDOM_PER_WALLET = "RANDOM_PER_WALLET",
  TOTAL_SPLIT_RANDOM = "TOTAL_SPLIT_RANDOM",
}

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

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

const clampToCapacity = (value: number, capacity: number) =>
  Math.min(Math.max(value, 0), Math.max(capacity, 0));

const scaleDownToTarget = (arr: number[], target: number): number[] => {
  const total = _.sum(arr);
  const floatingPointTolerance = 1e-12;
  if (total > target + floatingPointTolerance && total > 0) {
    const scale = target / total;
    return arr.map((value) => value * scale);
  }
  return arr;
};

export const redistributeToCapacity = (
  planned: number[],
  available: number[],
  targetTotal: number,
): number[] => {
  // Step 1: clamp each wallet to its available capacity
  let effective = planned.map((amount, index) =>
    clampToCapacity(amount, available[index]),
  );

  // Step 2: proportionally fill remaining capacity to close the deficit
  const deficit = Math.max(targetTotal - _.sum(effective), 0);
  if (deficit === 0) {
    return effective;
  }

  const remaining = available.map((cap, idx) =>
    Math.max(cap - effective[idx], 0),
  );
  const remainingTotal = _.sum(remaining);
  if (remainingTotal === 0) {
    return effective;
  }

  effective = effective.map(
    (amount, index) => amount + (remaining[index] / remainingTotal) * deficit,
  );

  // Step 3: scale → re-clamp → scale again to handle floating-point overshoot
  effective = scaleDownToTarget(effective, targetTotal);
  effective = effective.map((amt, idx) => clampToCapacity(amt, available[idx]));
  effective = scaleDownToTarget(effective, targetTotal);

  return effective;
};

/**
 * Extracts a detailed error message from various error types.
 * Handles Error objects, strings, and plain objects to avoid "[object Object]" messages.
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) {
    return "Unknown error";
  }

  // If it's already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's an Error object with a message property
  if (error instanceof Error) {
    return error.message;
  }

  // If it has a message property
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  // If it has a toString method, try it (but check if it's not just "[object Object]")
  if (typeof error?.toString === "function") {
    const str = error.toString();
    if (str && str !== "[object Object]") {
      return str;
    }
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
    if (nestedError !== "Unknown error") {
      return nestedError;
    }
  }

  // Try common error properties
  if (error?.reason && typeof error.reason === "string") {
    return error.reason;
  }
  if (error?.code) {
    return `Error code: ${error.code}`;
  }
  if (error?.name) {
    return `Error: ${error.name}`;
  }

  // Last resort: return a generic message
  return "Unknown error occurred";
};
