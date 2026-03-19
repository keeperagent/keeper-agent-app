import { useState } from "react";
import { Alert } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { Code } from "@/component";
import { useTranslation } from "@/hook";
import { actSetShouldShowResourceHelpAlert } from "@/redux/preference";
import { UploadButton } from "@/component/Button";
import { IResourceGroup } from "@/electron/type";
import ColumnPreview from "./ColumnPreview";
import ColumnConfig from "./ColumnConfig";
import ModalImportConfig from "./ModalImportConfig";
import ModalExportConfig from "./ModalExportConfig";
import { NUMBER_OF_COLUMN } from "@/electron/constant";
import { HelpWrapper, FormWrapper } from "./style";

type IConfigFormProps = {
  setConfig: (value: IColumnConfig) => void;
  config: IColumnConfig;
  isModalOpen: boolean;
  showResourceHelpAlert: boolean;
  actSetShouldShowResourceHelpAlert: (payload: boolean) => void;
  selectedResourceGroup: IResourceGroup | null;
};

export type IColumnConfig = {
  [key: string]: string | null;
};

const ConfigForm = (props: IConfigFormProps) => {
  const {
    setConfig,
    config,
    isModalOpen,
    showResourceHelpAlert,
    selectedResourceGroup,
  } = props;
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const [isModalImportConfigOpen, setModalImportConfigOpen] = useState(false);
  const [isModalExportConfigOpen, setModalExportConfigOpen] = useState(false);

  const { translate } = useTranslation();

  const onCloseAlert = () => {
    props?.actSetShouldShowResourceHelpAlert(false);
  };

  const onOpenModalImportConfig = (_event: any) => {
    setModalImportConfigOpen(true);
  };

  const onOpenModalExportConfig = () => {
    setModalExportConfigOpen(true);
  };

  return (
    <FormWrapper>
      {showResourceHelpAlert && (
        <Alert
          title={
            <HelpWrapper>
              {translate("resource.youCanPress")}
              <Code text="Tab" />
              {translate("resource.toMoveBetweenColumn")}
            </HelpWrapper>
          }
          type="warning"
          showIcon
          className="help"
          closable
          onClose={onCloseAlert}
        />
      )}

      {selectedResourceGroup && (
        <div className="import-export">
          <UploadButton
            text="Import"
            onClick={onOpenModalImportConfig}
            isUploadButton={false}
            style={{
              transform: "scale(0.8)",
              marginRight: "0.3rem",
              marginLeft: "auto",
            }}
          />

          <UploadButton
            text="Export"
            onClick={onOpenModalExportConfig}
            isUploadButton={true}
            style={{
              transform: "scale(0.8)",
              marginRight: "-0.5rem",
            }}
          />
        </div>
      )}

      <div className="list-column">
        {Array.from(Array(NUMBER_OF_COLUMN).keys()).map(
          (value: any, index: number) => (
            <ColumnConfig
              index={index}
              key={index}
              setActiveCol={setActiveCol}
              activeCol={activeCol}
              setConfig={setConfig}
              config={config}
              isModalOpen={isModalOpen}
            />
          ),
        )}
      </div>

      <div className="preview">
        {Array.from(Array(NUMBER_OF_COLUMN).keys()).map(
          (value: any, index: number) => (
            <ColumnPreview
              index={index}
              key={index}
              setActiveCol={setActiveCol}
              activeCol={activeCol}
              config={config}
            />
          ),
        )}
      </div>

      <ModalImportConfig
        isModalOpen={isModalImportConfigOpen}
        setModalOpen={setModalImportConfigOpen}
      />
      <ModalExportConfig
        isModalOpen={isModalExportConfigOpen}
        setModalOpen={setModalExportConfigOpen}
      />
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    showResourceHelpAlert: state?.Preference?.showResourceHelpAlert,
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
  }),
  {
    actSetShouldShowResourceHelpAlert,
  },
)(ConfigForm);
