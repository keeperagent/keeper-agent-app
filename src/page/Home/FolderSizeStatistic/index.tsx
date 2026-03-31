import { useMemo } from "react";
import { connect } from "react-redux";
import _ from "lodash";
import ReactECharts from "echarts-for-react";
import AnimatedNumbers from "react-animated-numbers";
import { RootState } from "@/redux/store";
import { COLORS } from "@/config/constant";
import { useTranslation } from "@/hook";
import { formatByte } from "@/service/util";
import { IFile } from "@/electron/type";
import { Wrapper } from "./style";

type IProps = {
  totalProfileSize: number;
  totalExtensionSize: number;
  totalTempSize: number;
  totalSkillSize: number;
  totalBrowserSize: number;
  database: IFile | null;
};

const FolderSizeStatistic = (props: IProps) => {
  const {
    totalProfileSize = 0,
    totalExtensionSize = 0,
    totalTempSize = 0,
    totalSkillSize = 0,
    totalBrowserSize = 0,
    database,
  } = props;
  const { translate } = useTranslation();

  const chartOptions = useMemo(() => {
    const maxSize =
      _.sum([
        totalProfileSize,
        totalExtensionSize,
        totalTempSize,
        totalSkillSize,
        totalBrowserSize,
        database?.size || 0,
      ]) || 0;

    const allSeries = [
      { name: "Database", data: [database?.size || 0], color: COLORS[0] },
      {
        name: "Extension folder",
        data: [totalExtensionSize],
        color: COLORS[6],
      },
      { name: "Browser folder", data: [totalBrowserSize], color: COLORS[8] },
      { name: "Profile folder", data: [totalProfileSize], color: COLORS[7] },
      { name: "Agent skill folder", data: [totalSkillSize], color: COLORS[4] },
    ].filter((item) => item.data[0] > 0);

    return {
      backgroundColor: "transparent",
      grid: { top: 0, right: 0, bottom: 0, left: 0 },
      xAxis: { type: "value", show: false, max: maxSize },
      yAxis: { type: "category", data: ["Storage"], show: false },
      legend: { show: false },
      tooltip: {
        trigger: "item",
        appendToBody: true,
        formatter: (params: any) => {
          const size = formatByte(Number(params.value));
          return `<div><div>${params.seriesName}:</div><strong>${size}</strong></div>`;
        },
      },
      series: allSeries.map((item) => ({
        name: item.name,
        type: "bar",
        stack: "total",
        data: item.data,
        label: {
          show: true,
          position: "inside",
          formatter: (params: any) => {
            if (Number(params.value) / maxSize < 0.08) {
              return "";
            }
            return formatByte(Number(params.value));
          },
          color: "#fff",
          fontSize: 11,
          textShadowColor: "rgba(0,0,0,0.4)",
          textShadowBlur: 3,
        },
        itemStyle: { color: item.color, borderWidth: 0 },
      })),
    };
  }, [
    totalProfileSize,
    totalExtensionSize,
    totalTempSize,
    totalSkillSize,
    totalBrowserSize,
    database?.size,
  ]);

  const totalSize = useMemo(() => {
    return formatByte(
      totalProfileSize +
        totalExtensionSize +
        totalBrowserSize +
        totalTempSize +
        totalSkillSize +
        (database?.size || 0),
    )?.split(" ");
  }, [
    totalProfileSize,
    totalExtensionSize,
    totalTempSize,
    totalSkillSize,
    totalBrowserSize,
    database?.size,
  ]);

  return (
    <Wrapper>
      <div className="total">
        <span className="label">{translate("totalSize")}: </span>

        <div className="value">
          <AnimatedNumbers animateToNumber={Number(totalSize?.[0])} />
          <span className="unit">{totalSize?.[1]}</span>
        </div>
      </div>

      <ReactECharts
        option={chartOptions}
        style={{ height: "30px", width: "100%" }}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    totalProfileSize: state?.Folder?.totalProfileSize,
    totalExtensionSize: state?.Folder?.totalExtensionSize,
    totalTempSize: state?.Folder?.totalTempSize,
    totalSkillSize: state?.Folder?.totalSkillSize,
    totalBrowserSize: state?.Folder?.totalBrowserSize,
    database: state?.Folder?.database,
  }),
  {},
)(FolderSizeStatistic);
