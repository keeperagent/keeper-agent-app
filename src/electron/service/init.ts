import { app } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { uid } from "uid/secure";
import {
  TEMP_FOLDER,
  EXTENSION_FOLDER,
  PROFILE_FOLDER,
  BROWSER_FOLDER,
  BASE_PROFILE_FOLDER,
  KA_SKILL_FOLDER,
  KA_WORKSPACE_FOLDER,
  KA_MEMORY_FOLDER,
} from "@/electron/constant";
import { preferenceDB } from "@/electron/database/preference";
import { logEveryWhere, removeLastTrailingSlash } from "./util";

const createFolderIfNotExist = () => {
  const tempFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), TEMP_FOLDER),
  );
  if (!fs.existsSync(tempFolder)) {
    logEveryWhere({ message: `Creating TEMP_FOLDER at ${tempFolder}` });
    fs.mkdirSync(tempFolder);
  } else {
    logEveryWhere({ message: `TEMP_FOLDER already exists at ${tempFolder}` });
  }

  const extensionFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), EXTENSION_FOLDER),
  );
  if (!fs.existsSync(extensionFolder)) {
    logEveryWhere({ message: `Creating EXTENSION_FOLDER at ${extensionFolder}` });
    fs.mkdirSync(extensionFolder);
  } else {
    logEveryWhere({ message: `EXTENSION_FOLDER already exists at ${extensionFolder}` });
  }

  const profileFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), PROFILE_FOLDER),
  );
  if (!fs.existsSync(profileFolder)) {
    logEveryWhere({ message: `Creating PROFILE_FOLDER at ${profileFolder}` });
    fs.mkdirSync(profileFolder);
  } else {
    logEveryWhere({ message: `PROFILE_FOLDER already exists at ${profileFolder}` });
  }

  const browserFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), BROWSER_FOLDER),
  );
  if (!fs.existsSync(browserFolder)) {
    logEveryWhere({ message: `Creating BROWSER_FOLDER at ${browserFolder}` });
    fs.mkdirSync(browserFolder);
  } else {
    logEveryWhere({ message: `BROWSER_FOLDER already exists at ${browserFolder}` });
  }

  const baseProfileFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), PROFILE_FOLDER, BASE_PROFILE_FOLDER),
  );
  if (!fs.existsSync(baseProfileFolder)) {
    logEveryWhere({ message: `Creating BASE_PROFILE_FOLDER at ${baseProfileFolder}` });
    fs.mkdirSync(baseProfileFolder);
  } else {
    logEveryWhere({ message: `BASE_PROFILE_FOLDER already exists at ${baseProfileFolder}` });
  }

  const skillFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), KA_SKILL_FOLDER),
  );
  if (!fs.existsSync(skillFolder)) {
    logEveryWhere({ message: `Creating KA_SKILL_FOLDER at ${skillFolder}` });
    fs.mkdirSync(skillFolder, { recursive: true });
  } else {
    logEveryWhere({ message: `KA_SKILL_FOLDER already exists at ${skillFolder}` });
  }

  const workspaceFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), KA_WORKSPACE_FOLDER),
  );
  if (!fs.existsSync(workspaceFolder)) {
    logEveryWhere({ message: `Creating KA_WORKSPACE_FOLDER at ${workspaceFolder}` });
    fs.mkdirSync(workspaceFolder, { recursive: true });
  } else {
    logEveryWhere({ message: `KA_WORKSPACE_FOLDER already exists at ${workspaceFolder}` });
  }

  const memoryFolder = removeLastTrailingSlash(
    path.join(app.getPath("userData"), KA_MEMORY_FOLDER),
  );
  if (!fs.existsSync(memoryFolder)) {
    logEveryWhere({ message: `Creating KA_MEMORY_FOLDER at ${memoryFolder}` });
    fs.mkdirSync(memoryFolder, { recursive: true });
  } else {
    logEveryWhere({ message: `KA_MEMORY_FOLDER already exists at ${memoryFolder}` });
  }
};

const getMacAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    if (!networkInterface) {
      continue;
    }

    for (const networkAddress of networkInterface) {
      if (
        !networkAddress?.internal &&
        networkAddress?.mac &&
        networkAddress?.mac !== "00:00:00:00:00:00"
      ) {
        return networkAddress.mac;
      }
    }
  }

  return null;
};

const initDeviceId = async () => {
  const [preference, err] = await preferenceDB.getOnePreferenceRaw();

  if (err && preference?.deviceId) {
    return;
  }

  let deviceId = "";
  const macAddress = getMacAddress();
  if (macAddress) {
    deviceId = crypto
      .createHash("sha256")
      .update(macAddress)
      .digest("hex")
      .slice(0, 9);
  } else {
    deviceId = uid(9);
  }

  await preferenceDB.updatePreference({
    id: preference?.id,
    deviceId: deviceId?.slice(0, 9),
  });
};

export { createFolderIfNotExist, initDeviceId };
