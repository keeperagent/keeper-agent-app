export interface ITheme {
  colorBgPrimary: string;
  colorBgSecondary: string;
  colorBgTransparent: string;
  colorBgTransparentLight: string;
  colorBgNested: string;
  colorBgTag: string;
  colorBorder: string;
  colorBorderInput: string;
  colorBorderDarkMode: string;
  menuLabelActiveColor: string;
  menuBgActive: string;
  colorTableBorder: string;
  scrollBarThumbColor: string;
  scrollBarTrackColor: string;
  colorBgWorkflow: string;
  colorBgNode: string;
  boxShadowNode: string;
  boxShadowNodeBold: string;
  colorBorderSecondary: string;
  colorBorderSubtle: string;
  colorBgStatistic: string;

  colorTextPrimary: string;
  colorTextSecondary: string;
  colorPrimary: string;
  colorSecondary: string;
  colorPrimaryLight: string;
  backgroundSideBarIcon: string;
  ghostBtnColor: string;
  ghostBtnColorHover: string;
  colorBgInput: string;
  clearBtnColorHover: string;
  colorBgInputDisable: string;
  colorBgUserMessage: string;
}

const lightTheme: ITheme = {
  colorBgPrimary: "rgb(255, 255, 255)",
  colorBgSecondary: "rgb(255, 255, 255)",
  colorBgTransparent: "rgba(133, 122, 233, 0.15)",
  colorBgTransparentLight: "rgba(133, 122, 233, 0.03)",
  colorBgNested: "rgba(99, 102, 241, 0.05)",
  colorBgTag: "#f2f2f2",
  colorBorder: "#e8e8e8",
  colorBorderInput: "rgb(79, 70, 229)",
  colorBorderDarkMode: "transparent",
  menuLabelActiveColor: "rgb(79, 70, 229)",
  menuBgActive: "rgba(133, 122, 233, 0.15)",
  colorTextPrimary: "rgb(56, 60, 64)",
  colorTextSecondary: "rgb(110, 107, 123)",
  colorTableBorder: "transparent",
  scrollBarThumbColor: "rgba(0, 0, 0, 0.5)",
  scrollBarTrackColor: "rgba(0, 0, 0, 0.1)",
  colorBgWorkflow: "rgba(0, 0, 0, 0.03)",
  colorBgNode: "white",
  boxShadowNode: "0px 0px 20px rgba(0, 0, 0, 0.05)",
  boxShadowNodeBold: "0px 0px 20px rgba(0, 0, 0, 0.2)",
  colorBorderSecondary: "transparent",
  colorBorderSubtle: "rgba(0, 0, 0, 0.07)",
  colorBgStatistic: "rgb(255, 255, 255)",

  colorPrimary: "rgb(79, 70, 229)",
  colorSecondary: "#F7EBFF",
  colorPrimaryLight: "rgb(133, 122, 233)",
  backgroundSideBarIcon: "rgba(0, 0, 0, 0.05)",
  ghostBtnColor: "rgb(79, 70, 229)",
  ghostBtnColorHover: "rgb(133, 122, 233)",
  colorBgInput: "#f2f2f2",
  clearBtnColorHover: "#ece0ed",
  colorBgInputDisable: "#f2f2f2",
  colorBgUserMessage: "rgb(242, 242, 242)",
};

const darkTheme: ITheme = {
  colorBgPrimary: "hsl(220 20% 4%)",
  colorBgSecondary: "rgb(20, 20, 20)",
  colorBgTransparent: "rgba(0, 0, 0, 0.7)",
  colorBgTransparentLight: "rgba(0, 0, 0, 0.3)",
  colorBgNested: "rgba(255, 255, 255, 0.035)",
  colorBgTag: "rgba(15, 15, 15, 0.7)",
  colorBorder: "rgba(80, 80, 80, 0.5)",
  colorBorderInput: "rgba(80, 80, 80, 0.7)",
  colorBorderDarkMode: "rgba(80, 80, 80, 0.5)",
  menuLabelActiveColor: "rgb(255, 255, 255)",
  menuBgActive: "rgba(79, 70, 229, 0.7)",
  colorTextPrimary: "rgb(255, 255, 255)",
  colorTextSecondary: "rgb(150, 150, 150)",
  colorTableBorder: "rgba(80, 80, 80, 0.3)",
  scrollBarThumbColor: "rgba(80, 80, 80, 1)",
  scrollBarTrackColor: "rgba(80, 80, 80, 0.5)",
  colorBgWorkflow: "rgba(50, 50, 50, 0.6)",
  colorBgNode: "rgb(20, 20, 20)",
  boxShadowNode: "transparent",
  boxShadowNodeBold: "0px 0px 20px rgba(255, 255, 255, 0.2)",
  colorBorderSecondary: "rgba(80, 80, 80, 0.7)",
  colorBorderSubtle: "rgba(255, 255, 255, 0.07)",
  colorBgStatistic: "rgb(28, 28, 28, 1)",

  colorPrimary: "rgb(79, 70, 229)",
  colorSecondary: "#F7EBFF",
  colorPrimaryLight: "rgb(133, 122, 233)",
  backgroundSideBarIcon: "rgba(255, 255, 255, 0.2)",
  ghostBtnColor: "rgb(133, 122, 233)",
  ghostBtnColorHover: "rgb(79, 70, 229)",
  colorBgInput: "rgb(92 84 98)",
  clearBtnColorHover: "rgb(62 55 68)",
  colorBgInputDisable: "rgba(0, 0, 0, 0.2)",
  colorBgUserMessage: "rgb(45, 45, 45)",
};

export { lightTheme, darkTheme };
