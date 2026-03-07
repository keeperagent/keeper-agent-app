import { useEffect } from "react";
import { Row, Col } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useGetStatistic,
  useTranslation,
  useGetFolderStatistic,
  useGetFolderPath,
} from "@/hook";
import { IProfileGroup, IStatistic } from "@/electron/type";
import { ProfileGroupChart } from "@/component";
import { actSetPageName } from "@/redux/layout";
import { COLORS, FOLDER_TYPE } from "@/config/constant";
import { IFolderPath, IFolderState } from "@/redux/folder";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";
import StatisticItem from "./StatisticItem";
import ListFolder from "./ListFolder";
import FolderSizeStatistic from "./FolderSizeStatistic";
import DatabaseInfo from "./DatabaseInfo";

type IProps = {
  statistic: IStatistic | null;
  actSetPageName: (payload: string) => void;
  folderState: IFolderState;
  folderPath: IFolderPath;
  listProfileGroup: IProfileGroup[];
};

const HomePage = (props: IProps) => {
  const { statistic, folderState, folderPath } = props;
  const { translate } = useTranslation();

  const { getStatistic } = useGetStatistic();
  const { getFolderPath } = useGetFolderPath();
  const { getFolderStatistic: getProfileFolderStatistic, loading: profilerFolderLoading } =
    useGetFolderStatistic("profile");
  const { getFolderStatistic: getExtensionFolderStatistic, loading: extensionFolderLoading } =
    useGetFolderStatistic("extension");
  const { getFolderStatistic: getSkillFolderStatistic, loading: skillFolderLoading } =
    useGetFolderStatistic("skill");
  const { getFolderStatistic: getBrowserFolderStatistic, loading: browserFolderLoading } =
    useGetFolderStatistic("browser");

  useEffect(() => {
    getStatistic();
    getFolderPath();
    getProfileFolderStatistic(20);
    getExtensionFolderStatistic(10);
    getSkillFolderStatistic(10);
    getBrowserFolderStatistic(2);
  }, []);

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.dashboard"));
  }, [translate]);

  const onOpenFolder = (folderPath: string) => {
    window?.electron?.send(MESSAGE.OPEN_FOLDER, {
      folderPath,
    });
  };

  return (
    <Wrapper>
      <title>{translate("sidebar.dashboard")}</title>

      <div className="data-statistic">
        <StatisticItem
          firstLabel={`${translate("home.numberCampaign")}:`}
          firstValue={statistic?.totalCampaign || 0}
          secondLabel={`${translate("home.numberWorkflow")}:`}
          secondValue={statistic?.totalWorkflow || 0}
        />

        <StatisticItem
          firstLabel={`${translate("home.numberProfileGroup")}:`}
          firstValue={statistic?.totalProfileGroup || 0}
          secondLabel={`${translate("home.numberProfile")}:`}
          secondValue={statistic?.totalProfile || 0}
        />

        <StatisticItem
          firstLabel={`${translate("home.numberWalletGroup")}:`}
          firstValue={statistic?.totalWalletGroup || 0}
          secondLabel={`${translate("home.numberWallet")}:`}
          secondValue={statistic?.totalWallet || 0}
        />

        <StatisticItem
          firstLabel={`${translate("home.numberMcpServer")}:`}
          firstValue={statistic?.totalMcpServer || 0}
          secondLabel={`${translate("home.numberAgentSkill")}:`}
          secondValue={statistic?.totalAgentSkill || 0}
        />
      </div>

      <div className="chart">
        <ProfileGroupChart />
      </div>

      <div className="file-statistic">
        <Row gutter={12} align="middle" style={{ overflow: "hidden" }}>
          <Col span={12}>
            <DatabaseInfo />
          </Col>

          <Col span={12}>
            <FolderSizeStatistic />
          </Col>
        </Row>

        <ListFolder
          title="Profile folder"
          listData={folderState?.profileFolder}
          totalSize={folderState?.totalProfileSize}
          itemPerRow={4}
          loading={profilerFolderLoading}
          totalData={folderState?.totalProfileFolder}
          color={COLORS[7]}
          type={FOLDER_TYPE.PROFILE}
          onClickMore={() => onOpenFolder(folderPath?.profileFolderPath)}
        />

        <Row gutter={12} style={{ marginBottom: "var(--margin-bottom-large)" }}>
          <Col span={12}>
            <ListFolder
              title="Extension folder"
              listData={folderState?.extensionFolder}
              totalSize={folderState?.totalExtensionSize}
              itemPerRow={2}
              loading={extensionFolderLoading}
              totalData={folderState?.totalExtensionFolder}
              color={COLORS[6]}
              type={FOLDER_TYPE.EXTENSION}
              onClickMore={() => onOpenFolder(folderPath?.extensionFolderPath)}
            />
          </Col>

          <Col span={12}>
            <ListFolder
              title="Browser folder"
              listData={folderState?.browserFolder}
              totalSize={folderState?.totalBrowserSize}
              itemPerRow={2}
              loading={browserFolderLoading}
              totalData={folderState?.totalBrowserFolder}
              color={COLORS[8]}
              type={FOLDER_TYPE.BROWSER}
              isBrowser={true}
              onClickMore={() => onOpenFolder(folderPath?.browserFolderPath)}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <ListFolder
              title={translate("home.skillFolder")}
              listData={folderState?.skillFolder}
              totalSize={folderState?.totalSkillSize}
              itemPerRow={2}
              loading={skillFolderLoading}
              totalData={folderState?.totalSkillFolder}
              color={COLORS[4]}
              type={FOLDER_TYPE.SKILL}
              onClickMore={() => onOpenFolder(folderPath?.skillFolderPath)}
            />
          </Col>

          <Col span={12}></Col>
        </Row>
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    statistic: state?.Preference?.statistic,
    folderState: state?.Folder,
    folderPath: state?.Folder?.folderPath,
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
  }),
  { actSetPageName }
)(HomePage);
