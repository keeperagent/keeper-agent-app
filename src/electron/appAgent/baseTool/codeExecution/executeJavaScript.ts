import { DynamicTool } from "@langchain/core/tools";
import { execFile } from "child_process";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { builtinModules } from "module";
import path from "path";
import { redact } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import { safeStringify } from "@/electron/appAgent/utils";
import {
  buildSafeEnv,
  containsSensitivePath,
  getWorkspaceRoot,
} from "@/electron/appAgent/baseTool/utils";
import { PlanState, type ToolContext } from "@/electron/appAgent/toolContext";
import { TOOL_KEYS } from "@/electron/constant";
import { loadPendingCode, removePendingCode } from "./pendingCodeStore";

const TIMEOUT_MS = 60_000;
const INSTALL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_LENGTH = 10_000;

// Tracks failed code per agentId to block duplicate retries programmatically
const failedCodeCache = new Map<string, Set<string>>();

const getJsWorkspaceDir = () => path.join(getWorkspaceRoot(), "javascript");

const getNodePath = (): string =>
  path.join(getJsWorkspaceDir(), "node_modules");

const ensurePackageJson = async (): Promise<void> => {
  const packageJsonPath = path.join(getJsWorkspaceDir(), "package.json");
  if (!existsSync(packageJsonPath)) {
    await writeFile(
      packageJsonPath,
      JSON.stringify(
        { name: "agent-workspace", version: "1.0.0", private: true },
        null,
        2,
      ),
      "utf-8",
    );
  }
};

const BUILTIN_MODULES = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);

const extractRequiredModules = (code: string): string[] => {
  const matches = [...code.matchAll(/require\(['"]([^'"]+)['"]\)/g)];
  return [
    ...new Set(
      matches
        .map((match) => match[1])
        .filter((name) => !BUILTIN_MODULES.has(name)),
    ),
  ];
};

const isModuleInstalled = (moduleName: string): boolean => {
  const modulePath = path.join(getJsWorkspaceDir(), "node_modules", moduleName);
  return existsSync(modulePath);
};

const installModules = (moduleNames: string[]): Promise<string> => {
  for (const moduleName of moduleNames) {
    if (!/^(@[a-zA-Z0-9_.-]+\/)?[a-zA-Z0-9_.-]+$/.test(moduleName)) {
      throw new Error(
        `Refusing to install suspicious module name: '${moduleName}'`,
      );
    }
  }
  const cwd = getJsWorkspaceDir();
  logEveryWhere({
    message: `[Agent] Installing modules [${moduleNames.join(", ")}] in ${cwd}`,
  });
  return new Promise((resolve, reject) => {
    execFile(
      "npm",
      ["install", ...moduleNames, "--save", "--ignore-scripts"],
      { timeout: INSTALL_TIMEOUT_MS, cwd },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
        } else {
          resolve(stdout.trim());
        }
      },
    );
  });
};

// Fallback: extract a single missing module name from a runtime error
const extractMissingModule = (errorMsg: string): string | null => {
  const match = errorMsg.match(
    /Cannot find module '(@[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+|[^'/]+)'/,
  );
  return match ? match[1] : null;
};

export const executeJavaScriptTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: TOOL_KEYS.EXECUTE_JAVASCRIPT,
    description:
      "Execute JavaScript code in a Node.js environment and return the output. " +
      "Only stdout is captured — use console.log() for output. stderr is included prefixed with [stderr]. " +
      "The code has a 60-second timeout. " +
      "Do NOT retry if the same error occurs — report it instead. " +
      "Input: the complete JavaScript code string to execute.",
    func: async (input: string) => {
      const agentId = String(toolContext?.agentProfileId || "main");
      // Module-level store is shared across all agent contexts (main + subagents)
      const stored = loadPendingCode(agentId);
      const code =
        stored?.language === "javascript"
          ? stored.code
          : toolContext?.pendingCode?.language === "javascript"
            ? toolContext.pendingCode.code
            : input;
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot execute code in planning mode. Call submit_plan with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      if (containsSensitivePath(code)) {
        return safeStringify({
          error:
            "Execution blocked: code references sensitive application files (database or profile data) that are not accessible to scripts.",
          status: "blocked_sensitive_path",
        });
      }
      const workspaceDir = getJsWorkspaceDir();
      await mkdir(workspaceDir, { recursive: true });
      const normalizedCode = code.trim();
      const agentFailedCodes =
        failedCodeCache.get(agentId) || new Set<string>();
      if (agentFailedCodes.has(normalizedCode)) {
        return safeStringify({
          error:
            "This exact code already failed in this session. Do not retry with identical code — fix the root cause or report the error to the user.",
          status: "blocked_duplicate_retry",
        });
      }
      const scriptPath = path.join(workspaceDir, `agent_script_${agentId}.cjs`);
      const childEnv = await buildSafeEnv(getWorkspaceRoot(), {
        NODE_PATH: getNodePath(),
      });

      const runScript = (): Promise<{ stdout: string; stderr: string }> =>
        new Promise((resolve, reject) => {
          execFile(
            "node",
            [scriptPath],
            {
              timeout: TIMEOUT_MS,
              maxBuffer: 1024 * 1024,
              cwd: getJsWorkspaceDir(),
              env: childEnv,
            },
            (error, stdout, stderr) => {
              if (error) {
                const msg = stderr?.trim() || error.message;
                reject(new Error(msg));
              } else {
                resolve({
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                });
              }
            },
          );
        });

      try {
        const wrappedCode = `(async () => {\n${code}\n})().catch(e => { console.error(e.message || e); process.exit(1); });`;
        await writeFile(scriptPath, wrappedCode, "utf-8");

        // Pre-check: install all missing modules at once before running
        const requiredModules = extractRequiredModules(code);
        const missingModules = requiredModules.filter(
          (moduleName) => !isModuleInstalled(moduleName),
        );
        if (missingModules.length > 0) {
          try {
            await ensurePackageJson();
            await installModules(missingModules);
            logEveryWhere({
              message: `[Agent] Installed [${missingModules.join(", ")}], running script`,
            });
          } catch (installErr: any) {
            logEveryWhere({
              message: `[Agent] Failed to install [${missingModules.join(", ")}]: ${installErr?.message}`,
            });
            return `Error: Could not install modules [${missingModules.join(", ")}]: ${installErr?.message}. Do NOT retry with the same code.`;
          }
        }

        let result: { stdout: string; stderr: string };
        try {
          result = await runScript();
        } catch (err: any) {
          // Fallback: handle dynamic require() not caught by static analysis
          const missingModule = extractMissingModule(err.message);
          if (missingModule) {
            try {
              await ensurePackageJson();
              await installModules([missingModule]);
              logEveryWhere({
                message: `[Agent] Installed '${missingModule}', retrying`,
              });
              result = await runScript();
            } catch (installErr: any) {
              logEveryWhere({
                message: `[Agent] Failed to install '${missingModule}': ${installErr?.message}`,
              });
              return `Error: Could not install module '${missingModule}': ${installErr?.message}. Do NOT retry with the same code.`;
            }
          } else {
            throw err;
          }
        }

        const { stdout, stderr } = result;

        // Combine stdout + stderr for full visibility
        let output = stdout;
        if (stderr) {
          output = output
            ? `${output}\n[stderr]: ${stderr}`
            : `[stderr]: ${stderr}`;
        }

        if (!output) {
          logEveryWhere({ message: "[Agent] execute_javascript: no output" });
          return "No output. Likely cause: missing `await` on a top-level async call (e.g. write `await fetchData()` not `fetchData()`), or missing console.log(). Fix the bug — do NOT retry with the same code.";
        }

        const { text: redactedOutput } = redact(output);
        const truncated =
          redactedOutput.length > MAX_OUTPUT_LENGTH
            ? redactedOutput.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : redactedOutput;

        // Success — clear pending code and failed cache
        removePendingCode(agentId);
        toolContext?.clearPendingCode();
        agentFailedCodes.delete(normalizedCode);
        logEveryWhere({
          message: `[Agent] execute_javascript: success (${stdout.length} chars)`,
        });
        return JSON.stringify({ output: truncated, executedCode: code });
      } catch (err: any) {
        // Cache the failed code to block duplicate retries
        removePendingCode(agentId);
        toolContext?.clearPendingCode();
        agentFailedCodes.add(normalizedCode);
        failedCodeCache.set(agentId, agentFailedCodes);
        logEveryWhere({
          message: `[Agent] execute_javascript() error: ${err?.message}`,
        });
        return `Error: ${err?.message || String(err)}. Do NOT retry with the same code.`;
      }
    },
  });
