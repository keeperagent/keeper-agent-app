import { app } from "electron";
import querystring from "querystring";
import path from "path";
import { mainWindow, sendToRenderer } from "@/electron/main";
import { MESSAGE, APP_PROTOCOL_NAME } from "@/electron/constant";

// in browser, after login by Gmail, browser will redirect user to keeperagent/auth?code=... -> it will open dialog to open app from browser
const registerDeeplink = () => {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(APP_PROTOCOL_NAME, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(APP_PROTOCOL_NAME);
  }
};

const handleDeeplinkMacOS = () => {
  app.on("open-url", (event, url) => {
    handleAuthToken(url);
  });
};

const handleDeeplinkWindow = () => {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", (event, commandLine, _workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }

      // the commandLine is array of strings in which last element is deep link url
      const url = commandLine.pop();
      if (url) {
        handleAuthToken(url);
      }
    });
  }
};

const handleAuthToken = (url: string) => {
  const { code } = querystring.parse(url.split("?")[1]);
  sendToRenderer(MESSAGE.GET_GOOGLE_AUTH_CODE, {
    code,
  });
};

export { registerDeeplink, handleDeeplinkMacOS, handleDeeplinkWindow };
