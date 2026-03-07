import { useMemo, useEffect, useState } from "react";
import _ from "lodash";
import Highcharts from "highcharts";
import HighChartMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import { COLORS } from "@/config/constant";
import { IResourceGroup, IWalletGroup } from "@/electron/type";
import { ChartWrapper } from "./style";

HighChartMore(Highcharts);

type IChartProps = {
  listWalletGroup: IWalletGroup[];
  listResourceGroup: IResourceGroup[];
};

const ProfileConfigChart = (props: IChartProps) => {
  const { listWalletGroup, listResourceGroup } = props;

  const [isDisplayChart, setDisplayChart] = useState(false); // wait to component didmount

  useEffect(() => {
    setDisplayChart(true);

    return () => {
      setDisplayChart(false);
    };
  }, []);

  const chartOptions = useMemo(() => {
    const listCount = [
      ..._.map(
        listResourceGroup,
        (group: IResourceGroup) => group?.totalResource
      ),
      ..._.map(listWalletGroup, (group: IWalletGroup) => group.totalWallet),
    ];

    const maxTotal = _.max(listCount) || 0;
    let zMax = 100;
    if (maxTotal !== 0) {
      zMax = listCount?.length === 1 ? maxTotal * 4 : maxTotal * 1.1;
    }

    return !isDisplayChart
      ? {}
      : {
          chart: {
            type: "packedbubble",
            height: "170px",
          },
          title: {
            text: "",
            align: "center",
          },
          legend: { enabled: false },
          plotOptions: {
            packedbubble: {
              minSize: "35%",
              maxSize: "130%",
              zMin: 0,
              zMax,
              layoutAlgorithm: {
                gravitationalConstant: 0.05,
                seriesInteraction: true,
                dragBetweenSeries: true,
                parentNodeLimit: true,
              },
              dataLabels: {
                enabled: true,
                format: "{point.name}",
                style: {
                  color: "black",
                  textOutline: "none",
                  fontWeight: "normal",
                  fontSize: "7px",
                },
              },
            },
          },
          series: [
            {
              name: "",
              color: "#B983FF",
              tooltip: {
                shadow: false,
                useHTML: true,
                pointFormat: " <b>{point.value}</b> items",
                headerFormat: "<div><b>{point.key}:</b></div>",
              },
              data: [
                ...listWalletGroup?.map((group: IWalletGroup) => ({
                  name: group?.name,
                  value: group?.totalWallet,
                  color: COLORS[5],
                })),
                ...listResourceGroup?.map((group: IResourceGroup) => ({
                  name: group?.name,
                  value: group?.totalResource,
                  color: COLORS[6],
                })),
              ],
            },
          ],
          exporting: {},
          // hide hightchart.com text
          credits: {
            enabled: false,
          },
        };
  }, [isDisplayChart, listWalletGroup, listResourceGroup]);

  return (
    <ChartWrapper>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </ChartWrapper>
  );
};

export default ProfileConfigChart;
