import { IElectron } from "./interface";

export {};

declare global {
  interface Window {
    electron: IElectron;
  }
}

