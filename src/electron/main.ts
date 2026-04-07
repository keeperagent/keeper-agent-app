import { app, BrowserWindow, net, protocol } from "electron";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "node:url";
import { FILE_PROTOCOL_NAME } from "./constant";
import { runMainProcess } from "./mainProcess";
import { dbReady } from "./database";
import { createFolderIfNotExist, initDeviceId } from "./service/init";
import {
  registerDeeplink,
  handleDeeplinkMacOS,
  handleDeeplinkWindow,
} from "./service/deeplink";
import { masterPasswordManager } from "./service/masterPassword";
import { encryptKeyCache } from "./service/encryptKeyCache";
import { cleanupAllAgentSessions } from "./controller/appAgent";
import { applyScreenCaptureProtection } from "./controller/preference";
import { parseWindowsPath, parseUnixPath } from "./util";

let mainWindow: BrowserWindow | null = null;
app.setName("Keeper Agent");
protocol.registerSchemesAsPrivileged([
  {
    scheme: FILE_PROTOCOL_NAME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

const installDevExtensions = async () => {
  const {
    default: installExtension,
    REDUX_DEVTOOLS,
  } = require("electron-devtools-installer");

  installExtension([REDUX_DEVTOOLS])
    .then((name: any) => console.log(`Added Extension:  ${name}`))
    .catch((err: any) => console.log("An error occurred: ", err?.message));
};

const createWindow = async () => {
  createFolderIfNotExist();
  await initDeviceId();

  if (!app.isPackaged) {
    await installDevExtensions();
  }

  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      devTools: !app.isPackaged,
      spellcheck: false,
      sandbox: true,
    },
  });

  mainWindow.maximize();
  runMainProcess();

  const isDev = !app.isPackaged;
  if (isDev) {
    await mainWindow.loadURL("http://localhost:4000");
  } else {
    const indexPath = path.join(app.getAppPath(), "build", "index.html");
    await mainWindow.loadFile(indexPath);
  }
};

app.on("ready", async () => {
  // Register protocol to support file.
  protocol.handle(FILE_PROTOCOL_NAME, async (request) => {
    try {
      const rawPath = request.url.slice(`${FILE_PROTOCOL_NAME}://`.length);
      const filePath = path.normalize(
        process.platform === "win32"
          ? parseWindowsPath(rawPath)
          : parseUnixPath(rawPath),
      );

      if (!fs.existsSync(filePath)) {
        return new Response(null, { status: 404 });
      }

      const resolved = fs.realpathSync.native(filePath);
      const base = fs.realpathSync.native(app.getPath("userData"));
      const relative = path.relative(base, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return new Response(null, { status: 403 });
      }

      return net.fetch(pathToFileURL(resolved).toString());
    } catch {
      return new Response(null, { status: 404 });
    }
  });

  // Only create window after database is fully loaded (avoids sqlite3 load-order / crash issues).
  await dbReady;
  await createWindow();
  registerDeeplink();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", async () => {
  encryptKeyCache.clear();
  masterPasswordManager.clearMasterPassword();
  await cleanupAllAgentSessions();
});

app.on("activate", async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

handleDeeplinkMacOS();
handleDeeplinkWindow();

app.on("browser-window-created", (_event, win) => {
  applyScreenCaptureProtection(win);
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const sendToRenderer = (channel: string, ...args: any[]) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
};

export { mainWindow, createWindow, sendToRenderer };
