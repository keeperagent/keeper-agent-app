import { Fragment, useState } from "react";
import { IJob, ISchedule } from "@/electron/type";
import { Wrapper } from "./style";
import Job from "./Job";
import EditJobModal from "./EditJobModal";

type IProps = {
  schedule: ISchedule;
};

const ScheduleFlow = ({ schedule }: IProps) => {
  const listJob = schedule?.listJob || [];
  const [editingJob, setEditingJob] = useState<IJob | null>(null);

  return (
    <Wrapper>
      {listJob?.map((job: IJob, index: number) => (
        <Fragment key={index}>
          <Job
            job={job}
            schedule={schedule}
            index={index}
            onOpenEdit={setEditingJob}
          />
          {index < listJob?.length - 1 && <div className="connector" />}
        </Fragment>
      ))}

      <EditJobModal
        open={Boolean(editingJob)}
        job={editingJob}
        schedule={schedule}
        onClose={() => setEditingJob(null)}
      />
    </Wrapper>
  );
};

export default ScheduleFlow;
