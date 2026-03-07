import { useContext } from "react";
import { LanguageContext, dictionaryList, LOCALE } from "@/language";

const useTranslation = () => {
  const { locale } = useContext(LanguageContext);

  const translate = (key: string) => {
    if (!dictionaryList[locale] || !dictionaryList[locale][key]) {
      console.warn(`Translation '${key}' for locale '${locale}' not found.`);
    }

    return dictionaryList[locale][key] || dictionaryList[LOCALE.EN][key] || "";
  };

  return {
    translate,
    locale,
  };
};

export { useTranslation };
