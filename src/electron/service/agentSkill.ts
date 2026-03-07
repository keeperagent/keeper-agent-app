import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { readFile, stat } from "fs/promises";
import JSZip from "jszip";
import {
  KA_SKILL_FOLDER,
  KA_WORKSPACE_FOLDER,
  KA_MEMORY_FOLDER,
} from "@/electron/constant";
import { logEveryWhere } from "./util";

const SKILL_MD_FILENAME = "SKILL.md";
const FOLDER_NAME_MAX_LEN = 100;

type ISkillInfo = {
  name?: string;
  description?: string;
  error?: string;
};

// Parse SKILL.md for name (required) and optional description.
const parseSkillMdContent = (md: string): ISkillInfo => {
  let name = "";
  let description = "";
  const nameRe = /^\s*name:\s*(.+)$/i;
  const descRe = /^\s*description:\s*(.+)$/i;

  for (const line of md.split(/\r?\n/)) {
    const nameMatch = line.match(nameRe);
    if (nameMatch && !name) {
      name = nameMatch[1].trim();
    }

    const descMatch = line.match(descRe);
    if (descMatch && !description) {
      description = descMatch[1].trim();
    }
    if (name && description) {
      break;
    }
  }

  return { name, description };
};

const normalizeFilename = (name: string = ""): string => {
  return name
    .trim()
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/\.\./g, "_")
    .replace(/^\.+/, "")
    .slice(0, FOLDER_NAME_MAX_LEN);
};

export const getSkillRootDir = (): string => {
  return path.join(app.getPath("userData"), KA_SKILL_FOLDER);
};

export const getWorkspaceDir = (): string =>
  path.join(app.getPath("userData"), KA_WORKSPACE_FOLDER);

export const getMemoryDir = (): string =>
  path.join(app.getPath("userData"), KA_MEMORY_FOLDER);

export const getSkillDirPath = (folderName: string): string => {
  const safe = normalizeFilename(folderName);
  return path.join(getSkillRootDir(), safe);
};

const readSkillMdAtPath = async (
  sourcePath: string,
): Promise<string | null> => {
  try {
    const st = await stat(sourcePath);
    const nameLower = path.basename(sourcePath).toLowerCase();

    if (st.isFile()) {
      if (nameLower.endsWith(".md")) {
        return await readFile(sourcePath, "utf-8");
      }

      if (nameLower.endsWith(".zip")) {
        const buffer = await readFile(sourcePath);
        const zip = await new JSZip().loadAsync(buffer);
        const entry =
          zip.file(SKILL_MD_FILENAME) ||
          Object.values(zip.files).find(
            (file) => /SKILL\.md$/i.test(file.name) && !file.dir,
          );
        if (entry) {
          return await entry.async("string");
        }
      }
    }

    return null;
  } catch (err: any) {
    logEveryWhere({ message: `[AgentSkill] readSkillMdAtPath error: ${err?.message}` });
    return null;
  }
};

/**
 If the only content in dir is a single subdirectory, move that subdirectory's
 contents up into dir (so SKILL.md at root when zip was "folder/SKILL.md").
 */
const flattenSingleSubdir = async (folderPath: string): Promise<void> => {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  if (entries.length !== 1 || !entries[0].isDirectory()) {
    return;
  }

  const subDir = path.join(folderPath, entries[0].name);
  const subEntries = await fs.readdir(subDir);
  for (const name of subEntries) {
    const src = path.join(subDir, name);
    const dest = path.join(folderPath, name);
    await fs.move(src, dest, { overwrite: true });
  }

  await fs.remove(subDir);
};

export const getFolderName = async (sourcePath: string): Promise<string> => {
  const validation = await readAndValidateSkillMdAtPath(sourcePath);
  return normalizeFilename(validation?.name);
};

export const readAndValidateSkillMdAtPath = async (
  sourcePath: string,
): Promise<ISkillInfo> => {
  const md = await readSkillMdAtPath(sourcePath);
  if (!md) {
    return { error: "No SKILL.md found in the selected file." };
  }

  const parsed = parseSkillMdContent(md);
  if (!parsed?.name) {
    return { error: "Invalid SKILL.md" };
  }
  return { name: parsed.name, description: parsed.description };
};

export const saveSkillFolder = async (
  folderName: string,
  sourcePath: string,
): Promise<void> => {
  try {
    const dir = getSkillDirPath(folderName);
    const isExist = await fs.pathExists(dir);
    if (isExist) {
      await deleteSkillDir(folderName);
    }

    await fs.ensureDir(dir);
    const stat = await fs.stat(sourcePath);
    const nameLower = path.basename(sourcePath).toLowerCase();

    if (stat.isFile()) {
      if (nameLower.endsWith(".zip")) {
        const buffer = await fs.readFile(sourcePath);
        const zip = await new JSZip().loadAsync(buffer);
        for (const [name, entry] of Object.entries(zip.files)) {
          if (!entry.dir) {
            const content = await entry.async("nodebuffer");
            const destPath = path.join(dir, name);
            await fs.ensureDir(path.dirname(destPath));
            await fs.writeFile(destPath, content);
          }
        }
        await flattenSingleSubdir(dir);
        logEveryWhere({ message: `[AgentSkill] Extracted zip to ${dir}` });
      } else {
        const destPath = path.join(dir, SKILL_MD_FILENAME);
        await fs.copyFile(sourcePath, destPath);
        logEveryWhere({ message: `[AgentSkill] Added skill file ${destPath}` });
      }
    }
  } catch (err: any) {
    logEveryWhere({ message: `[AgentSkill] saveSkillFolder error: ${err?.message}` });
    throw err;
  }
};

export const deleteSkillDir = async (folderName: string): Promise<void> => {
  try {
    const dir = getSkillDirPath(folderName);
    const isExist = await fs.pathExists(dir);
    if (isExist) {
      await fs.remove(dir);
      logEveryWhere({ message: `[AgentSkill] Deleted skill folder ${dir}` });
    }
  } catch (err: any) {
    logEveryWhere({ message: `[AgentSkill] deleteSkillDir error: ${err?.message}` });
  }
};
