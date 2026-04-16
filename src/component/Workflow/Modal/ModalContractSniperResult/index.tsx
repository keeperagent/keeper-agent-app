import _ from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Table } from "antd";
import { connect } from "react-redux";
import { Node } from "@xyflow/react";
import { RootState } from "@/redux/store";
import { useTranslation, useGetSampleContractSniperResult } from "@/hook";
import { actSetModalSampleContractSniperResultOpen } from "@/redux/workflowRunner";
import {
  WORKFLOW_TYPE,
  SNIPE_CONTRACT_BLOCK_NUMBER,
  SNIPE_CONTRACT_CONTRACT_ADDRESS,
  SNIPE_CONTRACT_LOG_INDEX,
  SNIPE_CONTRACT_TX_HASH,
} from "@/electron/constant";
import {
  ICampaign,
  IEVMSnipeContractNodeConfig,
  IWorkflow,
  IWorkflowVariable,
  ISnipeContractResult,
} from "@/electron/type";
import { TotalData, DataUpdateAt, SearchInput } from "@/component";
import { Wrapper } from "./style";
import FlowProfileDetail from "../ModalQueueData/FlowProfileDetail";

type IProps = {
  isModalSampleContractSniperResultOpen: boolean;
  actSetModalSampleContractSniperResultOpen: (payload: boolean) => void;
  selectedNodeID: string | null;
  nodes: Node[];
  selectedWorkflowType: string | null;
  sampleContractSniperResults: ISnipeContractResult[];
  contractSniperResultLastUpdate: number;
  totalContractSniperResult: number;
  selectedWorkflow: IWorkflow | null;
  selectedCampaign: ICampaign | null;
};

const renderColumns = (translate: any) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "7rem",
  },
  {
    title: "Block number",
    dataIndex: "blockNumber",
    width: "11rem",
  },
  {
    title: "Transaction hash",
    dataIndex: "txHash",
    width: "50rem",
  },
  {
    title: "Log index",
    dataIndex: "logIndex",
    width: "10rem",
  },
  {
    title: translate("workflow.contractAddress"),
    dataIndex: "contractAddress",
    width: "33rem",
  },
  {
    title: translate("workflow.eventDetail"),
    dataIndex: "detail",
    width: "10rem",
    align: "center",
    fixed: "right",
    render: (value: any, record: ISnipeContractResult) => {
      const blackListVariable = [
        SNIPE_CONTRACT_BLOCK_NUMBER,
        SNIPE_CONTRACT_TX_HASH,
        SNIPE_CONTRACT_LOG_INDEX,
        SNIPE_CONTRACT_CONTRACT_ADDRESS,
        "blockNumber",
        "contractAddress",
        "index",
        "logIndex",
        "txHash",
      ];

      const listVariable: IWorkflowVariable[] = [];
      Object.keys(record)?.forEach((variable) => {
        if (blackListVariable?.includes(variable)) {
          return;
        }
        listVariable.push({
          variable,
          value: record?.[variable],
        });
      });

      return (
        <div className="list-icon">
          <FlowProfileDetail listVariable={listVariable} hideLabel={true} />
        </div>
      );
    },
  },
];

const sampleSize = 300;
const ModalContractSniperResult = (props: IProps) => {
  const {
    isModalSampleContractSniperResultOpen,
    selectedNodeID,
    selectedWorkflowType,
    nodes,
    sampleContractSniperResults,
    contractSniperResultLastUpdate,
    totalContractSniperResult,
    selectedCampaign,
    selectedWorkflow,
  } = props;
  const intervalRef = useRef<any>(null);
  const { translate } = useTranslation();
  const [searchText, onSetSearchText] = useState("");

  const selectedNode: any = useMemo(() => {
    return _.find(nodes, { id: selectedNodeID });
  }, [selectedNodeID, nodes]);

  const { getSampleContractSniperResult, loading } =
    useGetSampleContractSniperResult();

  useEffect(() => {
    if (
      selectedWorkflowType !== WORKFLOW_TYPE.EVM_SNIPE_CONTRACT ||
      !selectedNode ||
      !isModalSampleContractSniperResultOpen
    ) {
      return;
    }

    const config = selectedNode?.data?.config as IEVMSnipeContractNodeConfig;
    getSampleContractSniperResult({
      config,
      sampleSize,
      campaignId: selectedCampaign?.id || 0,
      workflowId: selectedWorkflow?.id || 0,
    });
  }, [
    selectedNode,
    isModalSampleContractSniperResultOpen,
    selectedWorkflowType,
  ]);

  useEffect(() => {
    if (isModalSampleContractSniperResultOpen) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        onRefresh();
      }, 10 * 1000);
    }

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isModalSampleContractSniperResultOpen, selectedNode]);

  const onCloseModal = () => {
    props?.actSetModalSampleContractSniperResultOpen(false);
  };

  const dataSource: any[] = useMemo(() => {
    let listData = sampleContractSniperResults?.map(
      (result: ISnipeContractResult) => ({
        ...result,
        blockNumber: result[SNIPE_CONTRACT_BLOCK_NUMBER],
        txHash: result[SNIPE_CONTRACT_TX_HASH],
        logIndex: result[SNIPE_CONTRACT_LOG_INDEX],
        contractAddress: result[SNIPE_CONTRACT_CONTRACT_ADDRESS],
      }),
    );
    if (searchText) {
      listData = listData?.filter((data) => {
        const allValue = Object.values(data)?.map((value: string) =>
          value?.toString().toLowerCase(),
        );
        return allValue?.includes(searchText?.toLowerCase());
      });
    }

    listData = _.orderBy(listData, ["blockNumber"], ["desc"]);
    listData = listData?.map((data, index) => ({ ...data, index: index + 1 }));
    return listData;
  }, [sampleContractSniperResults, searchText]);

  const onShowTotalData = () => {
    const text = `${translate("from")} ${translate(
      "total",
    )} ${totalContractSniperResult} Events`;

    return <TotalData text={text} />;
  };

  const onRefresh = () => {
    if (
      selectedWorkflowType !== WORKFLOW_TYPE.EVM_SNIPE_CONTRACT ||
      !selectedNode
    ) {
      return;
    }

    const config = selectedNode?.data?.config as IEVMSnipeContractNodeConfig;
    getSampleContractSniperResult({
      config,
      sampleSize,
      campaignId: selectedCampaign?.id || 0,
      workflowId: selectedWorkflow?.id || 0,
    });
  };

  const onSearchText = (value: string) => {
    onSetSearchText(value);
  };

  return (
    <Modal
      open={isModalSampleContractSniperResultOpen}
      title={
        <div>
          <div>{translate("workflow.sampleLatestEvent")}</div>
          {onShowTotalData()}
        </div>
      }
      footer={null}
      style={{ top: "6rem" }}
      width="120rem"
      onCancel={onCloseModal}
      zIndex={3}
    >
      <Wrapper>
        <div className="heading">
          <SearchInput
            onChange={onSearchText}
            value={searchText}
            placeholder={translate("button.search")}
            style={{ width: "35rem", marginRight: "var(--margin-right)" }}
          />

          {contractSniperResultLastUpdate > 0 && (
            <DataUpdateAt
              timestamp={contractSniperResultLastUpdate}
              onRefresh={onRefresh}
            />
          )}
        </div>

        <Table
          // @ts-ignore
          columns={renderColumns(translate)}
          dataSource={dataSource}
          rowKey={(data: any) => data?.index}
          pagination={{
            total: dataSource?.length,
            pageSizeOptions: ["10", "30", "50"],
            size: "small",
            locale: { items_per_page: `/ ${translate("page")}` },
          }}
          size="middle"
          scroll={{ x: "150rem", y: "60rem" }}
          loading={loading}
        />
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalSampleContractSniperResultOpen:
      state?.WorkflowRunner?.isModalSampleContractSniperResultOpen,
    selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
    nodes: state?.WorkflowRunner?.flowData?.present?.nodes || [],
    selectedWorkflowType: state?.WorkflowRunner?.selectedWorkflowType,
    sampleContractSniperResults:
      state?.WorkflowRunner?.sampleContractSniperResults || [],
    contractSniperResultLastUpdate:
      state?.WorkflowRunner.contractSniperResultLastUpdate,
    totalContractSniperResult: state?.WorkflowRunner.totalContractSniperResult,
    selectedCampaign: state?.Campaign?.selectedCampaign,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  { actSetModalSampleContractSniperResultOpen },
)(ModalContractSniperResult);
