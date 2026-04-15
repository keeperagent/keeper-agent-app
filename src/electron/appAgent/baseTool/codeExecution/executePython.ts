import { DynamicTool } from "@langchain/core/tools";
import { execFile } from "child_process";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
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

const getPyWorkspaceDir = () => path.join(getWorkspaceRoot(), "python");

// Common Python stdlib module names — not exhaustive but covers the vast majority
const STDLIB_MODULES = new Set([
  "abc",
  "ast",
  "asyncio",
  "base64",
  "binascii",
  "builtins",
  "calendar",
  "cgi",
  "cgitb",
  "chunk",
  "cmath",
  "cmd",
  "code",
  "codecs",
  "codeop",
  "collections",
  "colorsys",
  "compileall",
  "concurrent",
  "configparser",
  "contextlib",
  "contextvars",
  "copy",
  "copyreg",
  "csv",
  "ctypes",
  "curses",
  "dataclasses",
  "datetime",
  "dbm",
  "decimal",
  "difflib",
  "dis",
  "doctest",
  "email",
  "encodings",
  "enum",
  "errno",
  "faulthandler",
  "fcntl",
  "filecmp",
  "fileinput",
  "fnmatch",
  "fractions",
  "ftplib",
  "functools",
  "gc",
  "getopt",
  "getpass",
  "gettext",
  "glob",
  "grp",
  "gzip",
  "hashlib",
  "heapq",
  "hmac",
  "html",
  "http",
  "idlelib",
  "imaplib",
  "importlib",
  "inspect",
  "io",
  "ipaddress",
  "itertools",
  "json",
  "keyword",
  "lib2to3",
  "linecache",
  "locale",
  "logging",
  "lzma",
  "mailbox",
  "marshal",
  "math",
  "mimetypes",
  "mmap",
  "modulefinder",
  "multiprocessing",
  "netrc",
  "nis",
  "nntplib",
  "numbers",
  "operator",
  "optparse",
  "os",
  "pathlib",
  "pdb",
  "pickle",
  "pickletools",
  "pipes",
  "pkgutil",
  "platform",
  "plistlib",
  "poplib",
  "posix",
  "posixpath",
  "pprint",
  "profile",
  "pstats",
  "pty",
  "pwd",
  "py_compile",
  "pyclbr",
  "pydoc",
  "queue",
  "quopri",
  "random",
  "re",
  "readline",
  "reprlib",
  "resource",
  "rlcompleter",
  "runpy",
  "sched",
  "secrets",
  "select",
  "selectors",
  "shelve",
  "shlex",
  "shutil",
  "signal",
  "site",
  "smtpd",
  "smtplib",
  "sndhdr",
  "socket",
  "socketserver",
  "spwd",
  "sqlite3",
  "ssl",
  "stat",
  "statistics",
  "string",
  "stringprep",
  "struct",
  "subprocess",
  "sunau",
  "symtable",
  "sys",
  "sysconfig",
  "syslog",
  "tabnanny",
  "tarfile",
  "telnetlib",
  "tempfile",
  "termios",
  "test",
  "textwrap",
  "threading",
  "time",
  "timeit",
  "tkinter",
  "token",
  "tokenize",
  "tomllib",
  "trace",
  "traceback",
  "tracemalloc",
  "tty",
  "turtle",
  "turtledemo",
  "types",
  "typing",
  "unicodedata",
  "unittest",
  "urllib",
  "uu",
  "uuid",
  "venv",
  "warnings",
  "wave",
  "weakref",
  "webbrowser",
  "wsgiref",
  "xdrlib",
  "xml",
  "xmlrpc",
  "zipapp",
  "zipfile",
  "zipimport",
  "zlib",
  "zoneinfo",
  "_thread",
]);

const extractRequiredModules = (code: string): string[] => {
  const importMatches = [...code.matchAll(/^\s*import\s+([a-zA-Z0-9_]+)/gm)];
  const fromMatches = [
    ...code.matchAll(/^\s*from\s+([a-zA-Z0-9_]+)\s+import/gm),
  ];
  const allModules = [
    ...importMatches.map((match) => match[1]),
    ...fromMatches.map((match) => match[1]),
  ];
  return [...new Set(allModules.filter((name) => !STDLIB_MODULES.has(name)))];
};

const isModuleInstalled = (
  moduleName: string,
  sitePackagesDir: string,
): boolean => {
  // pip installs as module_name or module-name (normalized)
  const normalized = moduleName.replace(/-/g, "_");
  return (
    existsSync(path.join(sitePackagesDir, moduleName)) ||
    existsSync(path.join(sitePackagesDir, normalized)) ||
    existsSync(path.join(sitePackagesDir, `${normalized}.py`))
  );
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

const installModules = async (
  moduleNames: string[],
  targetDir: string,
  cwd: string,
): Promise<string> => {
  for (const moduleName of moduleNames) {
    if (!/^[a-zA-Z0-9_-]+$/.test(moduleName)) {
      throw new Error(
        `Refusing to install suspicious module name: '${moduleName}'`,
      );
    }
  }
  logEveryWhere({
    message: `[Agent] pip installing [${moduleNames.join(", ")}] in ${cwd}`,
  });
  const baseArgs = ["install", ...moduleNames, "--target", targetDir];
  try {
    return await runPipInstall([...baseArgs, "--only-binary", ":all:"], cwd);
  } catch (binaryInstallError: any) {
    logEveryWhere({
      message: `[Agent] Binary-only install failed (${binaryInstallError?.message}), retrying without --only-binary`,
    });
    return runPipInstall(baseArgs, cwd);
  }
};

// Fallback: extract a single missing module name from a runtime error
const extractMissingModule = (errorMsg: string): string | null => {
  const match = errorMsg.match(/No module named '([^']+)'/);
  return match ? match[1].split(".")[0] : null;
};

export const executePythonTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: TOOL_KEYS.EXECUTE_PYTHON,
    description:
      "Execute Python code and return the output. " +
      "Only stdout is captured — use print() for output. stderr is included prefixed with [stderr]. " +
      "The code has a 60-second timeout. " +
      "Do NOT retry if the same error occurs — report it instead. " +
      "Input: the complete Python code string to execute.",
    func: async (input: string) => {
      const agentId = String(toolContext?.agentProfileId || "main");
      // Module-level store is shared across all agent contexts (main + subagents)
      const stored = loadPendingCode(agentId);
      const code =
        stored?.language === "python"
          ? stored.code
          : toolContext?.pendingCode?.language === "python"
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
      const workspaceDir = getPyWorkspaceDir();
      await mkdir(workspaceDir, { recursive: true });
      const sitePackagesDir = path.join(workspaceDir, "site-packages");
      await mkdir(sitePackagesDir, { recursive: true });
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

        // Pre-check: install all missing modules at once before running
        const requiredModules = extractRequiredModules(code);
        const missingModules = requiredModules.filter(
          (moduleName) => !isModuleInstalled(moduleName, sitePackagesDir),
        );
        if (missingModules.length > 0) {
          try {
            await installModules(missingModules, sitePackagesDir, workspaceDir);
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
          // Fallback: handle dynamic imports not caught by static analysis
          const missingModule = extractMissingModule(err.message);
          if (missingModule) {
            try {
              await installModules(
                [missingModule],
                sitePackagesDir,
                workspaceDir,
              );
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

        let output = stdout;
        if (stderr) {
          output = output
            ? `${output}\n[stderr]: ${stderr}`
            : `[stderr]: ${stderr}`;
        }

        if (!output) {
          logEveryWhere({ message: "[Agent] execute_python: no output" });
          return "No output. Likely cause: missing await (use asyncio.run(main()) for async code), or missing print(). Fix the bug — do NOT retry with the same code.";
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
          message: `[Agent] execute_python: success (${stdout.length} chars)`,
        });
        return JSON.stringify({ output: truncated, executedCode: code });
      } catch (err: any) {
        // Cache the failed code to block duplicate retries
        removePendingCode(agentId);
        toolContext?.clearPendingCode();
        agentFailedCodes.add(normalizedCode);
        failedCodeCache.set(agentId, agentFailedCodes);
        logEveryWhere({
          message: `[Agent] execute_python() error: ${err?.message}`,
        });
        return `Error: ${err?.message || String(err)}. Do NOT retry with the same code.`;
      }
    },
  });
