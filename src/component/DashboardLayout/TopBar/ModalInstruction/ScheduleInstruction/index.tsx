import { useMemo } from "react";
import { connect } from "react-redux";
import { useTranslation } from "@/hook";
import scheduleLightImg from "@/asset/schedule-light.png";
import scheduleDarkImg from "@/asset/schedule-dark.png";
import { RootState } from "@/redux/store";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
};

const ScheduleInstruction = (props: IProps) => {
  const { isLightMode } = props;
  const { locale } = useTranslation();

  const img = useMemo(() => {
    return isLightMode ? scheduleLightImg : scheduleDarkImg;
  }, [isLightMode]);

  const enContent = () => (
    <Wrapper>
      <div className="item" style={{ marginBottom: "1rem" }}>
        Used to schedule one or more workflows. This function helps you:
        schedule a workflow, schedule and configure the order of running
        multiple workflows in the same run.
      </div>

      <div className="item" style={{ marginBottom: "1rem" }}>
        Scheduled workflows can run in parallel at the same time if this
        workflow does not use functions that interact with the web browser.
        Running workflows in parallel helps you build and run bots in the most
        optimal way, for example you can use: 1 token swap workflow on Uniswap,
        1 token swap workflow on PancakeSwap, 1 workflow to get the balance of
        each wallet onchain and notify on Telegram.
      </div>

      <div className="image">
        <img src={img} alt="" />
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  {},
)(ScheduleInstruction);
