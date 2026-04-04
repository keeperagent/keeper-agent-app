import { DynamicTool } from "@langchain/core/tools";
import { execFile } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { app } from "electron";
import path from "path";
import { KA_WORKSPACE_FOLDER } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { safeStringify } from "@/electron/appAgent/utils";
import type { ToolContext } from "@/electron/appAgent/toolContext";

const TIMEOUT_MS = 60_000;
const INSTALL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_LENGTH = 10_000;

const getWorkspaceRoot = () =>
  path.join(app.getPath("userData"), KA_WORKSPACE_FOLDER);

const getPyWorkspaceDir = () => path.join(getWorkspaceRoot(), "python");

/** Extract module name from a "No module named" error message. */
const extractMissingModule = (errorMsg: string): string | null => {
  const match = errorMsg.match(/No module named '([^']+)'/);
  return match ? match[1].split(".")[0] : null;
};

/** Install a pip package into the python workspace. */
const installModule = (moduleName: string): Promise<string> => {
  const cwd = getPyWorkspaceDir();
  logEveryWhere({
    message: `[Agent] pip installing '${moduleName}' in ${cwd}`,
  });
  return new Promise((resolve, reject) => {
    execFile(
      "pip3",
      ["install", moduleName, "--target", path.join(cwd, "site-packages")],
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

export const executePythonTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: "execute_python",
    description:
      "Execute Python code and return the output. " +
      "The code runs in a child process with full access to imports and async. " +
      "Use print() to output results — only stdout is captured and returned. " +
      "Missing pip packages will be auto-installed on first use. " +
      "The code has a 60-second timeout. " +
      "IMPORTANT: Do NOT retry if the same error occurs. Report the error to the user instead. " +
      "Input: the Python code string to execute.",
    func: async (code: string) => {
      if (toolContext?.planningMode) {
        return safeStringify({
          error:
            "Cannot execute code in planning mode. Call submit_plan with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      const workspaceDir = getPyWorkspaceDir();
      await mkdir(workspaceDir, { recursive: true });
      const sitePackagesDir = path.join(workspaceDir, "site-packages");
      await mkdir(sitePackagesDir, { recursive: true });
      const scriptPath = path.join(workspaceDir, "agent_script.py");

      const runScript = (): Promise<{ stdout: string; stderr: string }> =>
        new Promise((resolve, reject) => {
          execFile(
            "python3",
            [scriptPath],
            {
              timeout: TIMEOUT_MS,
              maxBuffer: 1024 * 1024,
              cwd: getWorkspaceRoot(),
              env: {
                ...process.env,
                PYTHONPATH: sitePackagesDir,
              },
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
        await writeFile(scriptPath, code, "utf-8");

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

        let output = stdout;
        if (stderr) {
          output = output
            ? `${output}\n[stderr]: ${stderr}`
            : `[stderr]: ${stderr}`;
        }

        if (!output) {
          logEveryWhere({ message: "[Agent] execute_python: no output" });
          return "No output. Your code must use print() to output results. Do NOT retry without fixing this.";
        }

        const truncated =
          output.length > MAX_OUTPUT_LENGTH
            ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : output;

        logEveryWhere({
          message: `[Agent] execute_python: success (${stdout.length} chars)`,
        });
        return truncated;
      } catch (err: any) {
        logEveryWhere({
          message: `[Agent] execute_python() error: ${err?.message}`,
        });
        return `Error: ${err?.message || String(err)}. Do NOT retry with the same code.`;
      }
    },
  });
