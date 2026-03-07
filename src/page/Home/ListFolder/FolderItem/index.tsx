import { useMemo } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IFolder } from "@/electron/type";
import { FOLDER_TYPE } from "@/config/constant";
import folderImg from "@/asset/folder.png";
import chromeImg from "@/asset/chrome.png";
import { formatByte, formatTime, trimText } from "@/service/util";
import { useTranslation } from "@/hook";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  folder: IFolder;
  isLightMode: boolean;
  type: string;
};

const MAX_NAME_LENGTH = 27;

const FolderItem = (props: IProps) => {
  const { folder, isLightMode, type } = props;
  const { locale } = useTranslation();

  const onOpenFolder = () => {
    window?.electron?.send(MESSAGE.OPEN_FOLDER, {
      folderPath: folder?.path,
    });
  };

  const iconImg = useMemo(() => {
    if (type === FOLDER_TYPE.BROWSER) {
      return chromeImg;
    }

    return folderImg;
  }, [type]);

  return (
    <Wrapper className={!isLightMode ? "dark-mode" : ""} onClick={onOpenFolder}>
      <img src={iconImg} alt="" />

      <div className="detail">
        <div className="name">{trimText(folder?.name, MAX_NAME_LENGTH)}</div>
        <div className="statistic">
          <div className="last-edit">
            Last edit: {formatTime(folder?.lastEdit, locale)}
          </div>

          <div className="size">{formatByte(folder?.size)}</div>
        </div>
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  {}
)(FolderItem);
