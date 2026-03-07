import { Fragment } from "react";
import { IJob, ISchedule } from "@/electron/type";
import { Wrapper } from "./style";
import Job from "./Job";

type IProps = {
  schedule: ISchedule;
};

const ScheduleFlow = (props: IProps) => {
  const { schedule } = props;
  const listJob = schedule?.listJob || [];

  return (
    <Wrapper>
      {listJob?.map((job: IJob, index: number) => (
        <Fragment key={index}>
          <Job job={job} schedule={schedule} index={index} />
          {index < listJob?.length - 1 && <div className="connector" />}
        </Fragment>
      ))}
    </Wrapper>
  );
};

export default ScheduleFlow;
