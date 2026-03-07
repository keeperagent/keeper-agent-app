import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IGlobalSearchResult } from "@/electron/type";
import { RootState } from "./store";

type IGlobalSearchState = {
  result: IGlobalSearchResult | null;
};

const initialState: IGlobalSearchState = {
  result: null,
};

export const searchSlice = createSlice({
  name: "Search",
  initialState,
  reducers: {
    actSaveGlobalSearchResult: (
      state: IGlobalSearchState,
      action: PayloadAction<IGlobalSearchResult>,
    ) => {
      state.result = action.payload;
    },
  },
});

export const { actSaveGlobalSearchResult } = searchSlice.actions;

export const searchSelector = (state: RootState) => state.Search;

export default searchSlice.reducer;
