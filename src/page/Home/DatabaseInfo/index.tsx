import { useEffect } from "react";
import { Spin } from "antd";
import { connect } from "react-redux";
import { SecretText } from "@/component";
import { IFile } from "@/electron/type";
import { RootState } from "@/redux/store";
import { formatByte, trimText } from "@/service/util";
import { useGetDatabaseFileStatistic } from "@/hook";
import { COLORS } from "@/config/constant";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
  database: IFile | null;
};

const DatabaseInfo = (props: IProps) => {
  const { isLightMode, database } = props;

  const { getDatabaseFileStatistic, loading } = useGetDatabaseFileStatistic();

  useEffect(() => {
    getDatabaseFileStatistic();
  }, []);

  const onOpenFile = () => {
    window?.electron?.send(MESSAGE.OPEN_FOLDER, {
      folderPath: database?.path,
      isOpenFile: true,
    });
  };

  return (
    <Spin spinning={loading}>
      <Wrapper className={!isLightMode ? "dark-mode" : ""}>
        <div className="title">
          <div className="color" style={{ backgroundColor: COLORS[0] }} />
          <span>Database</span>
        </div>

        <div className="detail">
          <div className="item">
            <span className="label">Path: </span>

            <SecretText
              text={trimText(database?.path || "", 70)}
              onClick={onOpenFile}
              style={{ fontSize: "1.2rem" }}
            />
          </div>

          <div className="item">
            <div className="label">Size: </div>
            {formatByte(database?.size || 0)}
          </div>
        </div>
      </Wrapper>
    </Spin>
  );
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
    database: state?.Folder?.database,
  }),
  {}
)(DatabaseInfo);
