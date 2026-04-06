import { DynamicTool } from "@langchain/core/tools";
import { execFile } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redact } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import { safeStringify } from "@/electron/appAgent/utils";
import {
  buildSafeEnv,
  getWorkspaceRoot,
} from "@/electron/appAgent/baseTool/utils";
import { PlanState, type ToolContext } from "@/electron/appAgent/toolContext";

const TIMEOUT_MS = 60_000;
const INSTALL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_LENGTH = 10_000;

const getJsWorkspaceDir = () => path.join(getWorkspaceRoot(), "javascript");

/** NODE_PATH only includes ka_workspace/node_modules (agent-installed packages). */
const getNodePath = (): string =>
  path.join(getJsWorkspaceDir(), "node_modules");

/** Extract module name from a "Cannot find module" error message. */
const extractMissingModule = (errorMsg: string): string | null => {
  const match = errorMsg.match(/Cannot find module '([^'/]+)'/);
  return match ? match[1] : null;
};

/** Install an npm package into ka_workspace. */
const installModule = (moduleName: string): Promise<string> => {
  const cwd = getJsWorkspaceDir();
  logEveryWhere({
    message: `[Agent] Installing module '${moduleName}' in ${cwd}`,
  });
  return new Promise((resolve, reject) => {
    execFile(
      "npm",
      ["install", moduleName, "--save", "--ignore-scripts"],
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

export const executeJavaScriptTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: "execute_javascript",
    description:
      "Execute JavaScript code in a Node.js environment and return the output. " +
      "The code runs in a child process with full access to require() and async/await. " +
      "For HTTP requests: use the axios library — add const axios = require('axios'); then use axios.get(url), axios.post(url, data), etc. " +
      "Use console.log() to output results — only stdout is captured and returned. " +
      "Missing npm packages will be auto-installed on first use. " +
      "The code has a 60-second timeout. " +
      "IMPORTANT: Do NOT retry if the same error occurs. Report the error to the user instead. " +
      "Input: the JavaScript code string to execute.",
    func: async (code: string) => {
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot execute code in planning mode. Call submit_plan with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      const workspaceDir = getJsWorkspaceDir();
      await mkdir(workspaceDir, { recursive: true });
      const agentId = toolContext?.agentRegistryId || "main";
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
              cwd: getWorkspaceRoot(),
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

        let result: { stdout: string; stderr: string };
        try {
          result = await runScript();
        } catch (err: any) {
          const missingModule = extractMissingModule(err.message);
          if (missingModule) {
            try {
              await installModule(missingModule);
              logEveryWhere({
                message: `[Agent] Installed '${missingModule}', retrying workflow`,
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
          return "No output. Your code must use console.log() to print results. Do NOT retry without fixing this.";
        }

        const { text: redactedOutput } = redact(output);
        const truncated =
          redactedOutput.length > MAX_OUTPUT_LENGTH
            ? redactedOutput.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : redactedOutput;

        logEveryWhere({
          message: `[Agent] execute_javascript: success (${stdout.length} chars)`,
        });
        return truncated;
      } catch (err: any) {
        logEveryWhere({
          message: `[Agent] execute_javascript() error: ${err?.message}`,
        });
        return `Error: ${err?.message || String(err)}. Do NOT retry with the same code.`;
      }
    },
  });
