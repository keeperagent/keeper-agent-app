import { DynamicTool } from "@langchain/core/tools";
import { execFile } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redact } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import { safeStringify } from "@/electron/appAgent/utils";
import {
  buildSafeEnv,
  containsSensitivePath,
  escapeForRegex,
  getWorkspaceRoot,
} from "@/electron/appAgent/baseTool/utils";
import { PlanState, type ToolContext } from "@/electron/appAgent/toolContext";

const TIMEOUT_MS = 60_000;
const INSTALL_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_LENGTH = 10_000;

const getPyWorkspaceDir = () => path.join(getWorkspaceRoot(), "python");

const extractMissingModule = (errorMsg: string): string | null => {
  const match = errorMsg.match(/No module named '([^']+)'/);
  return match ? match[1].split(".")[0] : null;
};

const runPipInstall = (args: string[], cwd: string): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(
      "pip3",
      args,
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

const installModule = async (moduleName: string): Promise<string> => {
  if (!/^[a-zA-Z0-9_-]+$/.test(moduleName)) {
    throw new Error(
      `Refusing to install suspicious module name: '${moduleName}'`,
    );
  }

  const cwd = getPyWorkspaceDir();
  const targetDir = path.join(cwd, "site-packages");

  logEveryWhere({
    message: `[Agent] pip installing '${moduleName}' (binary-only) in ${cwd}`,
  });

  const baseArgs = ["install", moduleName, "--target", targetDir];

  try {
    return await runPipInstall([...baseArgs, "--only-binary", ":all:"], cwd);
  } catch (binaryInstallError: any) {
    logEveryWhere({
      message: `[Agent] Binary-only install of '${moduleName}' failed (${binaryInstallError?.message}), retrying without --only-binary`,
    });

    return runPipInstall(baseArgs, cwd);
  }
};

export const executePythonTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: "execute_python",
    description:
      "Execute Python code and return the output. " +
      "The code runs in a child process with full access to imports and async. " +
      "Use print() to output results — only stdout is captured and returned. " +
      "If the code requires external pip packages, list them explicitly in your submit_plan summary BEFORE calling this tool, so the user can see what will be installed. " +
      "The code has a 60-second timeout. " +
      "IMPORTANT: Do NOT retry if the same error occurs. Report the error to the user instead. " +
      "Input: the Python code string to execute.",
    func: async (code: string) => {
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
      const workspaceDir = getPyWorkspaceDir();
      await mkdir(workspaceDir, { recursive: true });
      const sitePackagesDir = path.join(workspaceDir, "site-packages");
      await mkdir(sitePackagesDir, { recursive: true });
      const agentId = toolContext?.agentProfileId || "main";
      const scriptPath = path.join(workspaceDir, `agent_script_${agentId}.py`);
      const childEnv = await buildSafeEnv(getWorkspaceRoot(), {
        PYTHONPATH: sitePackagesDir,
      });

      const runScript = (): Promise<{ stdout: string; stderr: string }> =>
        new Promise((resolve, reject) => {
          execFile(
            "python3",
            [scriptPath],
            {
              timeout: TIMEOUT_MS,
              maxBuffer: 1024 * 1024,
              cwd: getPyWorkspaceDir(),
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
        await writeFile(scriptPath, code, "utf-8");

        let result: { stdout: string; stderr: string };
        try {
          result = await runScript();
        } catch (err: any) {
          const missingModule = extractMissingModule(err.message);
          if (missingModule) {
            const approvedPlan = toolContext?.approvedPlan || "";
            const modulePattern = new RegExp(
              `\\b${escapeForRegex(missingModule)}\\b`,
              "i",
            );
            if (!modulePattern.test(approvedPlan)) {
              return safeStringify({
                error: `Package '${missingModule}' was not listed in the approved plan. Re-draft your plan explicitly listing all pip packages that will be installed, then ask the user to approve again.`,
                status: "blocked_unapproved_package",
              });
            }
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

        const { text: redactedOutput } = redact(output);
        const truncated =
          redactedOutput.length > MAX_OUTPUT_LENGTH
            ? redactedOutput.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : redactedOutput;

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
