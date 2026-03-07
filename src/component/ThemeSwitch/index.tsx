import { useRef } from "react";
import { ToggleDarkModeWrapper } from "./style";
import { RootState } from "@/redux/store";
import { connect } from "react-redux";
import { actToggleLightMode } from "@/redux/layout";
import { DASHBOARD_LIGHT_MODE_KEY } from "@/config/constant";

const ThemeSwitch = (props: any) => {
  const { isLightMode } = props;

  const buttonRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);

  const moonRefClass = moonRef?.current?.classList;
  const buttonRefClass = buttonRef?.current?.classList;

  const switchDarkLightMode = () => {
    props?.actToggleLightMode(!isLightMode);
    sessionStorage?.setItem(DASHBOARD_LIGHT_MODE_KEY, String(!isLightMode));
    moonRefClass?.toggle("sun");
    buttonRefClass?.toggle("day");
  };

  return (
    <ToggleDarkModeWrapper onClick={switchDarkLightMode}>
      <div className={isLightMode ? "night day" : "night"} ref={buttonRef}>
        <div className={isLightMode ? "moon sun" : "moon"} ref={moonRef}></div>
      </div>
    </ToggleDarkModeWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isLightMode: state.Layout.isLightMode,
  }),
  { actToggleLightMode },
)(ThemeSwitch);
