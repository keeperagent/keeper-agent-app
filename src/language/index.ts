import { createContext } from "react";
import en from "./en.json";

export const dictionaryList: { [key: string]: { [key: string]: string } } = {
  en,
};

export const LOCALE = {
  EN: "en",
};

export const listLocale = {
  [LOCALE.EN]: "English",
};

export const LanguageContext = createContext({
  locale: LOCALE.EN,
  onChangeLocale: (_locale: string) => {},
});
