import { useContext, useEffect } from "react";
import { Dropdown, MenuProps } from "antd";
import { useTranslation } from "@/hook";
import { LOCALE, LanguageContext } from "@/language";
import enFlag from "@/asset/en.png";
import { LanguageSwitcherWrapper, MenuIconWrapper } from "./style";

const LanguageSwitch = () => {
  const { onChangeLocale } = useContext(LanguageContext);
  const { translate, locale } = useTranslation();

  useEffect(() => {
    const cacheItem = localStorage.getItem("locale");
    if (cacheItem) {
      onChangeLocale(cacheItem);
    }
  }, []);

  const dropdownConfig: MenuProps["items"] = [
    {
      key: LOCALE.EN,
      label: (
        <MenuIconWrapper onClick={() => onChangeLocale(LOCALE.EN)}>
          <div className="img-wrapper">
            <img src={enFlag} alt="en" className="language-flag" />
          </div>
          {translate("english")}
        </MenuIconWrapper>
      ),
    },
  ];

  return (
    <LanguageSwitcherWrapper>
      <Dropdown menu={{ items: dropdownConfig }} placement="topRight">
        <div className="img-wrapper">
          <img src={locale === LOCALE.EN ? enFlag : enFlag} alt="flag" />
        </div>
      </Dropdown>
    </LanguageSwitcherWrapper>
  );
};

export default LanguageSwitch;
