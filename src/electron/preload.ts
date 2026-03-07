import { contextBridge, ipcRenderer, webUtils } from "electron";

// https://stackoverflow.com/questions/48148021/how-to-import-ipcrenderer-in-react/49034244
// should not expose all @ipcRenderer method to front-end

contextBridge.exposeInMainWorld("electron", {
  send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
  on: (channel: string, callback?: any) => ipcRenderer.on(channel, callback),
  removeAllListeners: (channel: string) =>
    ipcRenderer.removeAllListeners(channel),
  /** Absolute filesystem path for a File (from input or drop). */
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
});
