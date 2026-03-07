import { useMemo } from "react";
import { Spin, Badge } from "antd";
import AnimatedNumbers from "react-animated-numbers";
import { Empty } from "antd";
import { DoubleRightArrowIcon } from "@/component/Icon";
import { IFolder } from "@/electron/type";
import { useTranslation } from "@/hook";
import { formatByte } from "@/service/util";
import { Wrapper } from "./style";
import FolderItem from "./FolderItem";
import BrowserDownload from "./BrowserDownload";

type IProps = {
  title: string;
  listData: IFolder[];
  totalData: number;
  totalSize: number;
  itemPerRow: number;
  loading: boolean;
  color: string;
  type: string;
  isBrowser?: boolean;
  onClickMore: () => void;
};

const ListFolder = (props: IProps) => {
  const {
    title,
    listData,
    itemPerRow,
    loading,
    totalData,
    totalSize,
    color,
    type,
    isBrowser,
    onClickMore,
  } = props;

  const { translate } = useTranslation();

  const folderSize = useMemo(() => {
    return formatByte(totalSize)?.split(" ");
  }, [totalSize]);

  return (
    <Wrapper>
      <div className="heading">
        <div className="color" style={{ backgroundColor: color }} />
        <div className="title">{title}</div>

        {totalData > 0 && (
          <div className="folder-statistic">
            <Badge status="success" />
            <div className="value">
              <AnimatedNumbers
                animateToNumber={totalData}
                fontStyle={{ fontSize: "1.2rem", letterSpacing: "0.1px" }}
              />
              <span className="unit">folder{totalData > 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {totalSize > 0 && (
          <div className="folder-statistic">
            <Badge status="processing" />
            <div className="value">
              <AnimatedNumbers
                animateToNumber={Number(folderSize?.[0])}
                fontStyle={{ fontSize: "1.2rem", letterSpacing: "0.1px" }}
              />
              <span className="unit">{folderSize?.[1]}</span>
            </div>
          </div>
        )}

        <div className="more" onClick={onClickMore}>
          {translate("more")}
          <div className="icon">
            <DoubleRightArrowIcon color="#867ae9" />
          </div>
        </div>
      </div>

      {isBrowser && <BrowserDownload />}

      <Spin spinning={loading}>
        <div className="list-folder">
          {listData?.map((folder: IFolder, index: number) => (
            <div
              className="item"
              key={index}
              style={{ flexBasis: `${100 / itemPerRow}%` }}
            >
              <FolderItem folder={folder} type={type} />
            </div>
          ))}
        </div>
      </Spin>

      <div className="empty">{listData?.length === 0 && <Empty />}</div>
    </Wrapper>
  );
};

export default ListFolder;
