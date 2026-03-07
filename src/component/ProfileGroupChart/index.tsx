import { useMemo, useState, useEffect } from "react";
import { Spin, Empty } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import Highcharts from "highcharts";
import HighChartMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import { RootState } from "@/redux/store";
import { COLORS } from "@/config/constant";
import { useGetListProfileGroup, useTranslation } from "@/hook";
import { IProfileGroup, IResourceGroup } from "@/electron/type";
import { Wrapper } from "./style";

HighChartMore(Highcharts);

type IProps = {
  listProfileGroup: IProfileGroup[];
  isLightMode: boolean;
  showEmptyIcon?: boolean;
};

const ProfileGroupChart = (props: IProps) => {
  const { listProfileGroup, isLightMode, showEmptyIcon } = props;
  const [isDisplayChart, setDisplayChart] = useState(false); // wait to component didmount

  const { translate } = useTranslation();
  const { getListProfileGroup, loading } = useGetListProfileGroup();

  useEffect(() => {
    setDisplayChart(true);
    getListProfileGroup({ page: 0, pageSize: 10000 });

    return () => {
      setDisplayChart(false);
    };
  }, []);

  const chartOptions = useMemo(() => {
    let listCount: number[] = [];
    listProfileGroup.forEach((profileGroup: IProfileGroup) => {
      listCount.push(profileGroup?.walletGroup?.totalWallet || 0);
      listCount = [
        ...listCount,
        ..._.map(
          profileGroup?.listResourceGroup,
          (resourceGroup: IResourceGroup) => resourceGroup?.totalResource || 0,
        ),
      ];
    });

    let zMax = 100;
    const maxTotal = _.max(listCount) || 0;
    if (maxTotal !== 0) {
      zMax = listCount?.length === 1 ? maxTotal * 4 : maxTotal * 1.1;
    }

    return !isDisplayChart
      ? {}
      : {
          chart: {
            type: "packedbubble",
            height: "400px",
          },
          title: {
            text: translate("profileGroup.chartTitle"),
            align: "left",
            style: {
              fontSize: "1.3rem",
              color: isLightMode ? "rgb(56, 60, 64)" : "rgb(255, 255, 255)",
            },
          },
          legend: { enabled: true },
          plotOptions: {
            packedbubble: {
              minSize: "25%",
              maxSize: "80%",
              zMin: 0,
              zMax,
              layoutAlgorithm: {
                gravitationalConstant: 0.05,
                splitSeries: true,
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
                  fontSize: "8px",
                },
              },
            },
          },
          series: listProfileGroup?.map((profileGroup: IProfileGroup) => ({
            name: profileGroup?.name,
            color: "#B983FF",
            tooltip: {
              useHTML: true,
              pointFormat: `<b>{point.name}:</b> <b>{point.value}</b> ${translate(
                "profile.record",
              )}`,
            },
            data: [
              {
                name: profileGroup?.walletGroup?.name,
                value: profileGroup?.walletGroup?.totalWallet,
                color: COLORS[5],
              },
              ...(profileGroup?.listResourceGroup || [])?.map(
                (resourceGroup: IResourceGroup) =>
                  ({
                    name: resourceGroup?.name,
                    value: resourceGroup?.totalResource,
                    color: COLORS[6],
                  }) as any,
              ),
            ],
          })),
          exporting: {},
          // hide hightchart.com text
          credits: {
            enabled: false,
          },
        };
  }, [isDisplayChart, listProfileGroup, translate, isLightMode]);

  if (listProfileGroup?.length === 0) {
    return showEmptyIcon ? (
      <Wrapper>
        <div className="empty">
          <Empty />
        </div>
      </Wrapper>
    ) : null;
  }

  return (
    <Spin spinning={loading}>
      <Wrapper>
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </Wrapper>
    </Spin>
  );
};

export default connect(
  (state: RootState) => ({
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
    totalData: state?.ProfileGroup?.totalData,
    isLightMode: state?.Layout?.isLightMode,
  }),
  {},
)(ProfileGroupChart);
