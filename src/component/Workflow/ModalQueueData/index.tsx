import { Modal, Table, Badge, Tooltip, Row } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { useMemo } from "react";
import { RootState } from "@/redux/store";
import { actSetModalQueueOpen } from "@/redux/workflowRunner";
import { TrashBoldIcon } from "@/component/Icon";
import { DeleteButton } from "@/component/Button";
import { useTranslation, useStopThread } from "@/hook";
import { ICampaign, IFlowProfile, IWorkflow } from "@/electron/type";
import { formatTimeToDate } from "@/service/util";
import { Wrapper } from "./style";
import FlowProfileDetail from "./FlowProfileDetail";

const renderColumns = (
  translate: any,
  onCleanQueue: (threadID: string) => Promise<void>,
) => [
  {
    title: translate("thread"),
    dataIndex: "index",
    width: "8%",
  },
  {
    title: translate("campaign.round"),
    dataIndex: "round",
    width: "8%",
  },
  {
    title: translate("workflow.createAt"),
    dataIndex: "initialTimestamp",
    width: "25%",
    render: (value: number) => formatTimeToDate(Number(value)),
  },
  {
    title: translate("workflow.lastestRun"),
    dataIndex: "startTimestamp",
    width: "25%",
    render: (value: number, record: IFlowProfile) =>
      `${formatTimeToDate(Number(value))} (${translate("take")} ${Math.round(
        record?.lastRunDuration! / 1000,
      )}s)`,
  },
  {
    title: translate("workflow.nextRun"),
    dataIndex: "nextRunTimestamp",
    width: "25%",
    render: (value: number) => (
      <span>
        <Badge
          status={value < new Date().getTime() ? "success" : "error"}
          style={{ marginRight: "0.7rem" }}
        />
        <span>{formatTimeToDate(Number(value))}</span>
      </span>
    ),
  },
  {
    title: "Profile",
    dataIndex: "profile",
    width: "10%",
    align: "center",
    render: (value: any, record: IFlowProfile) => {
      return (
        <div className="list-icon">
          <FlowProfileDetail listVariable={record?.listVariable || []} />
        </div>
      );
    },
  },
  {
    title: "",
    dataIndex: "action",
    width: "5%",
    align: "center",
    render: (value: any, record: IFlowProfile) => {
      return (
        <div className="list-icon">
          <Tooltip title={translate("workflow.deleteThread")}>
            <span
              className="icon"
              style={{ marginLeft: "0.7rem" }}
              onClick={() => onCleanQueue(record?.threadID?.toString())}
            >
              <TrashBoldIcon />
            </span>
          </Tooltip>
        </div>
      );
    },
  },
];

type IModalProps = {
  isModalQueueOpen: boolean;
  actSetModalQueueOpen: (payload: boolean) => void;
  mapThread: {
    [threadID: string]: IFlowProfile;
  };
  selectedEdgeID: string | null;
  selectedNodeID: string | null;
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
};

const ModalQueueData = (props: IModalProps) => {
  const { translate } = useTranslation();
  const {
    isModalQueueOpen,
    mapThread,
    selectedEdgeID,
    selectedNodeID,
    selectedCampaign,
    selectedWorkflow,
  } = props;
  const { stopThread } = useStopThread();

  const listFlowProfile = useMemo(() => {
    return Object.values(mapThread).filter((flowProfile: IFlowProfile) => {
      if (flowProfile?.edgeID === selectedEdgeID) {
        return true;
      }

      if (flowProfile?.nodeID === selectedNodeID) {
        return true;
      }

      return false;
    });
  }, [selectedEdgeID, selectedNodeID, mapThread]);

  const dataSource: any[] = useMemo(() => {
    const listData = listFlowProfile?.map((flowProfile: IFlowProfile) => ({
      ...flowProfile,
      round: flowProfile?.profile?.round! + 1,
      index: Number(flowProfile?.threadID) + 1,
    }));

    return _.sortBy(listData, Number("threadID"));
  }, [listFlowProfile]);

  const onCleanQueue = async (threadID?: string) => {
    await stopThread(
      selectedWorkflow?.id || 0,
      selectedCampaign?.id || 0,
      threadID,
    );
  };

  const onCloseModal = () => {
    props?.actSetModalQueueOpen(false);
  };

  return (
    <Modal
      open={isModalQueueOpen}
      title={translate("workflow.queueData")}
      style={{ top: "6rem" }}
      footer={null}
      width="120rem"
      onCancel={onCloseModal}
      destroyOnHidden={true}
      zIndex={3}
    >
      <Wrapper>
        <Table
          // @ts-ignore
          columns={renderColumns(translate, onCleanQueue)}
          dataSource={dataSource}
          rowKey={(data) => data?.profile?.id!}
          pagination={false}
          size="small"
          scroll={{ x: "70rem", y: "60rem" }}
        />

        {dataSource?.length > 0 && (
          <Row justify="end" style={{ marginTop: "var(--margin-top)" }}>
            <DeleteButton
              text={translate("workflow.clearQueue")}
              onClick={() => onCleanQueue(undefined)}
              disabled={dataSource?.length === 0}
            />
          </Row>
        )}
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalQueueOpen: state?.WorkflowRunner?.isModalQueueOpen,
    mapThread: state?.WorkflowRunner.mapThread,
    selectedEdgeID: state?.WorkflowRunner.selectedEdgeID,
    selectedNodeID: state?.WorkflowRunner.selectedNodeID,
    selectedCampaign: state?.Campaign?.selectedCampaign,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  { actSetModalQueueOpen },
)(ModalQueueData);
