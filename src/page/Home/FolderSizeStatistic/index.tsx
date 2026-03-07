import { useMemo } from "react";
import { connect } from "react-redux";
import _ from "lodash";
import Highcharts from "highcharts";
import AnimatedNumbers from "react-animated-numbers";
import HighChartMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import { RootState } from "@/redux/store";
import { COLORS } from "@/config/constant";
import { useTranslation } from "@/hook";
import { formatByte } from "@/service/util";
import { IFile } from "@/electron/type";
import { Wrapper } from "./style";

HighChartMore(Highcharts);

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

    return {
      chart: {
        type: "bar",
        height: "90px",
      },
      title: {
        text: "",
      },
      yAxis: {
        visible: false,
        max: maxSize,
      },
      xAxis: {
        categories: ["Storage"],
        visible: false,
      },
      legend: { enabled: false },
      tooltip: {
        useHTML: true,
        // @ts-ignore
        formatter: function () {
          // @ts-ignore
          const size = formatByte(Number(this?.y));

          // @ts-ignore
          const name = this?.series?.name;

          return `
          <div>
            <div>${name}:</div>
            <strong>${size}</strong>
          </div>
         `;
        },
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            // @ts-ignore
            formatter: function () {
              // @ts-ignore
              return formatByte(Number(this?.y));
            },
          },
        },
        bar: {
          borderWidth: 0,
        },
      },
      series: [
        {
          name: "Database",
          data: [database?.size || 0],
          color: COLORS[0],
        },
        {
          name: "Extension folder",
          data: [totalExtensionSize],
          color: COLORS[6],
        },
        {
          name: "Browser folder",
          data: [totalBrowserSize],
          color: COLORS[8],
        },
        {
          name: "Profile folder",
          data: [totalProfileSize],
          color: COLORS[7],
        },
        {
          name: "Agent skill folder",
          data: [totalSkillSize],
          color: COLORS[4],
        },
      ]?.filter((item: any) => item?.data?.[0] > 0),
      // hide hightchart.com text
      credits: {
        enabled: false,
      },
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
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
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
