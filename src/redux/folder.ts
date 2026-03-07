import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IFile, IFolder } from "@/electron/type";
import { RootState } from "./store";

export type IFolderPath = {
  profileFolderPath: string;
  extensionFolderPath: string;
  tempFolderPath: string;
  skillFolderPath: string;
  browserFolderPath: string;
};

export interface IFolderState {
  profileFolder: IFolder[];
  extensionFolder: IFolder[];
  tempFolder: IFolder[];
  skillFolder: IFolder[];
  browserFolder: IFolder[];
  folderPath: IFolderPath;

  totalProfileFolder: number;
  totalExtensionFolder: number;
  totalTempFolder: number;
  totalSkillFolder: number;
  totalBrowserFolder: number;

  totalProfileSize: number;
  totalExtensionSize: number;
  totalTempSize: number;
  totalSkillSize: number;
  totalBrowserSize: number;

  database: IFile | null;
}

const initialState: IFolderState = {
  profileFolder: [],
  extensionFolder: [],
  tempFolder: [],
  skillFolder: [],
  browserFolder: [],
  folderPath: {
    profileFolderPath: "",
    extensionFolderPath: "",
    tempFolderPath: "",
    skillFolderPath: "",
    browserFolderPath: "",
  },
  totalProfileFolder: 0,
  totalExtensionFolder: 0,
  totalTempFolder: 0,
  totalSkillFolder: 0,
  totalBrowserFolder: 0,
  totalProfileSize: 0,
  totalExtensionSize: 0,
  totalTempSize: 0,
  totalSkillSize: 0,
  totalBrowserSize: 0,
  database: null,
};

export const folderSlice = createSlice({
  name: "Folder",
  initialState,
  reducers: {
    actSaveProfileFolderStatistic: (
      state: IFolderState,
      action: PayloadAction<{
        listFolder: IFolder[];
        totalFolder: number;
        totalSize: number;
      }>,
    ) => {
      const { payload } = action;
      state.profileFolder = payload?.listFolder;
      state.totalProfileFolder = payload?.totalFolder;
      state.totalProfileSize = payload?.totalSize;
    },
    actSaveExtensionFolderStatistic: (
      state: IFolderState,
      action: PayloadAction<{
        listFolder: IFolder[];
        totalFolder: number;
        totalSize: number;
      }>,
    ) => {
      const { payload } = action;
      state.extensionFolder = payload?.listFolder;
      state.totalExtensionFolder = payload?.totalFolder;
      state.totalExtensionSize = payload?.totalSize;
    },
    actSaveTempFolderStatistic: (
      state: IFolderState,
      action: PayloadAction<{
        listFolder: IFolder[];
        totalFolder: number;
        totalSize: number;
      }>,
    ) => {
      const { payload } = action;
      state.tempFolder = payload?.listFolder;
      state.totalTempFolder = payload?.totalFolder;
      state.totalTempSize = payload?.totalSize;
    },
    actSaveSkillFolderStatistic: (
      state: IFolderState,
      action: PayloadAction<{
        listFolder: IFolder[];
        totalFolder: number;
        totalSize: number;
      }>,
    ) => {
      const { payload } = action;
      state.skillFolder = payload?.listFolder;
      state.totalSkillFolder = payload?.totalFolder;
      state.totalSkillSize = payload?.totalSize;
    },
    actSaveBrowserFolderStatistic: (
      state: IFolderState,
      action: PayloadAction<{
        listFolder: IFolder[];
        totalFolder: number;
        totalSize: number;
      }>,
    ) => {
      const { payload } = action;
      state.browserFolder = payload?.listFolder;
      state.totalBrowserFolder = payload?.totalFolder;
      state.totalBrowserSize = payload?.totalSize;
    },
    actSaveDatabaseStatistic: (
      state: IFolderState,
      action: PayloadAction<IFile>,
    ) => {
      const { payload } = action;
      state.database = payload;
    },
    actSaveFolderPath: (
      state: IFolderState,
      action: PayloadAction<IFolderPath>,
    ) => {
      const { payload } = action;
      state.folderPath = payload;
    },
  },
});

export const {
  actSaveProfileFolderStatistic,
  actSaveExtensionFolderStatistic,
  actSaveTempFolderStatistic,
  actSaveSkillFolderStatistic,
  actSaveBrowserFolderStatistic,
  actSaveDatabaseStatistic,
  actSaveFolderPath,
} = folderSlice.actions;
export const folderSelector = (state: RootState) => state.Extension;
export default folderSlice.reducer;
