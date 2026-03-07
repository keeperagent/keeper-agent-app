import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Modal } from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { connect } from "react-redux";
import { Node } from "@xyflow/react";
import { RootState } from "@/redux/store";
import { useTranslation, useGetPriceCheckingData } from "@/hook";
import {
  actSetModalPriceCheckingOpen,
  actSetPriceCheckingData,
  CacheItem,
} from "@/redux/workflowRunner";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { ICheckTokenPriceNodeConfig } from "@/electron/type";
import { Wrapper } from "./style";

type IProps = {
  isModalPriceCheckingOpen: boolean;
  actSetModalPriceCheckingOpen: (payload: boolean) => void;
  actSetPriceCheckingData: (payload: { data: CacheItem[] }) => void;
  selectedNodeID: string | null;
  nodes: Node[];
  selectedWorkflowType: string | null;
  priceCheckingData: CacheItem[];
  isLightMode: boolean;
};

let interval: any = null;

const ModalTokenPrice = (props: IProps) => {
  const {
    isModalPriceCheckingOpen,
    selectedNodeID,
    selectedWorkflowType,
    nodes,
    priceCheckingData,
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

  const { getPriceCheckingData } = useGetPriceCheckingData();

  const config = selectedNode?.data?.config as ICheckTokenPriceNodeConfig;
  useEffect(() => {
    if (
      selectedWorkflowType !== WORKFLOW_TYPE.CHECK_TOKEN_PRICE ||
      !selectedNode ||
      !isModalPriceCheckingOpen
    ) {
      return;
    }

    getPriceCheckingData({ config });
    clearInterval(interval);
    interval = setInterval(() => {
      getPriceCheckingData({ config });
    }, 10000);
  }, [selectedNode, isModalPriceCheckingOpen, selectedWorkflowType]);

  const compareValue = useMemo(() => {
    return config?.compareValue ? Number(config?.compareValue) : 0;
  }, [config]);

  const chartOptions = useMemo(() => {
    const textColor = isLightMode ? "rgb(56, 60, 64)" : "rgb(255, 255, 255)";

    const yValues = priceCheckingData?.map((data: CacheItem) => data?.value);
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
              text: "Price ($)",
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
                  text: "Trigger price",
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
              return `<div>Time: <b>${formattedTime}</b></div> <div>Price: <b>$ ${this.y}</b></div>`;
            },
            headerFormat: "",
          },
          series: [
            {
              name: "",
              color: "#B983FF",
              data: priceCheckingData?.map((data: CacheItem) => [
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
  }, [isDisplayChart, priceCheckingData, isLightMode, compareValue]);

  const onCloseModal = () => {
    props?.actSetModalPriceCheckingOpen(false);
    props?.actSetPriceCheckingData({ data: [] });
  };

  return (
    <Modal
      open={isModalPriceCheckingOpen}
      title={translate("workflow.tokenPriceChart")}
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
    isModalPriceCheckingOpen: state?.WorkflowRunner?.isModalPriceCheckingOpen,
    selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes || [],
    selectedWorkflowType: state?.WorkflowRunner?.selectedWorkflowType,
    priceCheckingData: state?.WorkflowRunner?.priceCheckingData || [],
    isLightMode: state?.Layout?.isLightMode,
  }),
  { actSetModalPriceCheckingOpen, actSetPriceCheckingData }
)(ModalTokenPrice);
