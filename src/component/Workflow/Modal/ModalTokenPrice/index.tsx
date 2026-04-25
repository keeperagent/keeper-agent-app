import _ from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Modal } from "antd";
import ReactECharts from "echarts-for-react";
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

const ModalTokenPrice = (props: IProps) => {
  const {
    isModalPriceCheckingOpen,
    selectedNodeID,
    selectedWorkflowType,
    nodes,
    priceCheckingData,
    isLightMode,
  } = props;
  const intervalRef = useRef<any>(null);
  const { translate } = useTranslation();

  const [isDisplayChart, setDisplayChart] = useState(false); // wait to component didmount

  useEffect(() => {
    setDisplayChart(true);

    return () => {
      setDisplayChart(false);
      clearInterval(intervalRef.current);
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
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      getPriceCheckingData({ config });
    }, 10000);
  }, [selectedNode, isModalPriceCheckingOpen, selectedWorkflowType]);

  const compareValue = useMemo(() => {
    return config?.compareValue ? Number(config?.compareValue) : 0;
  }, [config]);

  const chartOptions = useMemo(() => {
    if (!isDisplayChart) {
      return {};
    }

    const textColor = isLightMode ? "rgb(56, 60, 64)" : "rgb(255, 255, 255)";
    const gridColor = isLightMode ? "#ebebeb" : "#252525";
    const axisColor = isLightMode ? "#ddd" : "#383838";
    const tooltipBg = isLightMode ? "#fff" : "#1c1c1c";
    const tooltipBorder = isLightMode ? "#e0e0e0" : "#383838";

    const yValues = priceCheckingData.map((item: CacheItem) => item?.value);
    const maxYValue = yValues.length > 0 ? Math.max(...yValues) : 0;
    const yAxisMax = compareValue > maxYValue ? compareValue * 1.2 : undefined;

    return {
      backgroundColor: "transparent",
      grid: { top: 20, right: 20, bottom: 35, left: 20, containLabel: true },
      xAxis: {
        type: "time",
        name: "Time (HH:mm:ss)",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { fontSize: 13, fontWeight: 600, color: textColor },
        axisLabel: {
          formatter: (value: number) => dayjs(value).format("HH:mm:ss"),
          color: textColor,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: axisColor } },
        axisTick: { lineStyle: { color: axisColor } },
        splitLine: { lineStyle: { color: gridColor, width: 0.5 } },
      },
      yAxis: {
        type: "value",
        name: "Price ($)",
        nameLocation: "middle",
        nameGap: 55,
        nameTextStyle: { fontSize: 13, fontWeight: 600, color: textColor },
        max: yAxisMax,
        axisLabel: { color: textColor, fontSize: 11 },
        axisLine: { lineStyle: { color: axisColor } },
        axisTick: { lineStyle: { color: axisColor } },
        splitLine: { lineStyle: { color: gridColor, width: 0.5 } },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const param = Array.isArray(params) ? params[0] : params;
          const formattedTime = dayjs(param.data[0]).format("HH:mm:ss");
          return `<div>Time: <b>${formattedTime}</b></div><div>Price: <b>$ ${param.data[1]}</b></div>`;
        },
      },
      series: [
        {
          type: "line",
          data: priceCheckingData.map((item: CacheItem) => [
            item.createdAt,
            item?.value,
          ]),
          lineStyle: { color: "#B983FF", width: 2 },
          itemStyle: { color: "#B983FF" },
          symbolSize: 6,
          markLine: {
            silent: true,
            symbol: ["none", "none"],
            lineStyle: { color: "#16BF78", type: "dashed", width: 3 },
            label: {
              show: true,
              position: "insideEndTop",
              formatter: "Trigger price",
              color: textColor,
              fontSize: 12,
            },
            data: [{ yAxis: compareValue }],
          },
        },
      ],
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
      mask={{ closable: true }}
    >
      <Wrapper>
        <ReactECharts
          option={chartOptions}
          style={{ height: "400px", width: "100%" }}
          notMerge={true}
        />
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
  { actSetModalPriceCheckingOpen, actSetPriceCheckingData },
)(ModalTokenPrice);
