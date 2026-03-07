import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Modal } from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighChartMore from "highcharts/highcharts-more";
import { connect } from "react-redux";
import { Node } from "@xyflow/react";
import { RootState } from "@/redux/store";
import { useTranslation, useGetMarketcapCheckingData } from "@/hook";
import {
  actSetModalMarketcapCheckingOpen,
  actSetMarketcapCheckingData,
  CacheItem,
} from "@/redux/workflowRunner";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { ICheckMarketcapNodeConfig } from "@/electron/type";
import { Wrapper } from "./style";

HighChartMore(Highcharts);

type IProps = {
  isModalMarketcapCheckingOpen: boolean;
  actSetModalMarketcapCheckingOpen: (payload: boolean) => void;
  actSetMarketcapCheckingData: (payload: { data: CacheItem[] }) => void;
  selectedNodeID: string | null;
  nodes: Node[];
  selectedWorkflowType: string | null;
  marketcapCheckingData: CacheItem[];
  isLightMode: boolean;
};

let interval: any = null;

const ModalMarketcap = (props: IProps) => {
  const {
    isModalMarketcapCheckingOpen,
    selectedNodeID,
    selectedWorkflowType,
    nodes,
    marketcapCheckingData,
    isLightMode,
  } = props;
  const { translate } = useTranslation();

  const [isDisplayChart, setDisplayChart] = useState(false); // wait to component didmount

  useEffect(() => {
    setDisplayChart(true);

    return () => {
      setDisplayChart(false);
      clearInterval(interval);
    };
  }, []);

  const selectedNode: any = useMemo(() => {
    return _.find(nodes, { id: selectedNodeID });
  }, [selectedNodeID, nodes]);

  const { getMarketcapCheckingData } = useGetMarketcapCheckingData();

  const config = selectedNode?.data?.config as ICheckMarketcapNodeConfig;
  useEffect(() => {
    if (
      selectedWorkflowType !== WORKFLOW_TYPE.CHECK_MARKETCAP ||
      !selectedNode ||
      !isModalMarketcapCheckingOpen
    ) {
      return;
    }

    getMarketcapCheckingData({ config });
    clearInterval(interval);
    interval = setInterval(() => {
      getMarketcapCheckingData({ config });
    }, 10000);
  }, [selectedNode, isModalMarketcapCheckingOpen, selectedWorkflowType]);

  const compareValue = useMemo(() => {
    return config?.compareValue ? Number(config?.compareValue) : 0;
  }, [config]);

  const chartOptions = useMemo(() => {
    const textColor = isLightMode ? "rgb(56, 60, 64)" : "rgb(255, 255, 255)";

    const yValues = marketcapCheckingData?.map(
      (data: CacheItem) => data?.value
    );
    const maxYValue = Math.max(...yValues);
    const yAxisMax = compareValue > maxYValue ? compareValue * 1.2 : undefined;

    return !isDisplayChart
      ? {}
      : {
          chart: {
            type: "line",
          },
          title: {
            text: "",
            align: "center",
          },
          legend: { enabled: false },
          xAxis: {
            title: {
              text: "Time (HH:mm:ss)",
              style: {
                fontSize: "13px",
                fontWeight: 600,
                color: textColor,
              },
            },
            labels: {
              // @ts-ignore
              formatter: function () {
                // @ts-ignore
                return dayjs(this?.value).format("HH:mm:ss");
              },
              style: {
                fontSize: "11px",
                color: textColor,
              },
            },
          },
          yAxis: {
            title: {
              text: "Marketcap ($)",
              style: {
                fontSize: "13px",
                fontWeight: 600,
                color: textColor,
              },
            },
            max: yAxisMax,
            plotLines: [
              {
                zIndex: 1000,
                color: "#16BF78",
                dashStyle: "shortdash",
                width: 3,
                value: compareValue,
                label: {
                  text: "Trigger marketcap",
                  style: {
                    fontSize: "12px",
                    color: textColor,
                  },
                },
              },
            ],
            labels: {
              style: {
                fontSize: "11px",
                color: textColor,
              },
            },
            gridLineWidth: 0.5,
          },
          tooltip: {
            useHTML: true,
            // @ts-ignore
            pointFormatter: function () {
              // @ts-ignore
              const formattedTime = dayjs(this?.x).format("HH:mm:ss");
              // @ts-ignore
              return `<div>Time: <b>${formattedTime}</b></div> <div>Marketcap: <b>$ ${this.y}</b></div>`;
            },
            headerFormat: "",
          },
          series: [
            {
              name: "",
              color: "#B983FF",
              data: marketcapCheckingData?.map((data: CacheItem) => [
                data.createdAt,
                data?.value,
              ]),
              marker: {
                radius: 3,
              },
            },
          ],
          exporting: {},
          // hide hightchart.com text
          credits: {
            enabled: false,
          },
        };
  }, [isDisplayChart, marketcapCheckingData, isLightMode, compareValue]);

  const onCloseModal = () => {
    props?.actSetModalMarketcapCheckingOpen(false);
    props?.actSetMarketcapCheckingData({ data: [] });
  };

  return (
    <Modal
      open={isModalMarketcapCheckingOpen}
      title={translate("workflow.marketcapChart")}
      footer={null}
      style={{ top: "6rem" }}
      width="120rem"
      onCancel={onCloseModal}
      zIndex={3}
      maskClosable={true}
    >
      <Wrapper>
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalMarketcapCheckingOpen:
      state?.WorkflowRunner?.isModalMarketcapCheckingOpen,
    selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes || [],
    selectedWorkflowType: state?.WorkflowRunner?.selectedWorkflowType,
    marketcapCheckingData: state?.WorkflowRunner?.marketcapCheckingData || [],
    isLightMode: state?.Layout?.isLightMode,
  }),
  { actSetModalMarketcapCheckingOpen, actSetMarketcapCheckingData }
)(ModalMarketcap);
