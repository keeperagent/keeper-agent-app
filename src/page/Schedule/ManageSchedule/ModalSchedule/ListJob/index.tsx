import { useEffect } from "react";
import { Tooltip } from "antd";
import { useGetListCampaign, useTranslation } from "@/hook";
import { PlusIcon } from "@/component/Icon";
import { IJob } from "@/electron/type";
import { Wrapper } from "./style";
import JobPicker from "./JobPicker";

type IProps = {
  onChangeJob: (scheduleWorkflow: IJob, index: number) => void;
  onAddJob: () => void;
  onRemoveJob: (index: number) => void;
  listJob: IJob[];
};

const ListJob = (props: IProps) => {
  const { onChangeJob, onAddJob, onRemoveJob, listJob } = props;
  const { translate } = useTranslation();
  const { getListCampaign } = useGetListCampaign();

  useEffect(() => {
    getListCampaign({ page: 1, pageSize: 1000 });
  }, []);

  return (
    <Wrapper
      style={{
        overflowY: listJob?.length > 2 ? "scroll" : "hidden",
      }}
    >
      {listJob.map((job, index) => (
        <JobPicker
          key={`${job?.id}-${index}`}
          index={index}
          job={job}
          isLastJob={index === listJob.length - 1}
          onChangeJob={onChangeJob}
          onRemoveJob={onRemoveJob}
        />
      ))}

      <div className="add">
        <Tooltip title={translate("add")}>
          <div className="icon" onClick={onAddJob}>
            <PlusIcon />
          </div>
        </Tooltip>
      </div>
    </Wrapper>
  );
};

export default ListJob;
