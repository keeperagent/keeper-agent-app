import { useState } from "react";
import { Alert } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { Code } from "@/component";
import { useTranslation } from "@/hook";
import { actSetShouldShowResourceHelpAlert } from "@/redux/preference";
import ColumnConfig from "./ColumnConfig";
import ColumnPreview from "./ColumnPreview";
import { NUMBER_OF_COLUMN } from "@/electron/constant";
import { HelpWrapper, FormWrapper } from "./style";

type IConfigFormProps = {
  setConfig: (value: IColumnConfig) => void;
  config: IColumnConfig;
  isModalOpen: boolean;
  showResourceHelpAlert: boolean;
  actSetShouldShowResourceHelpAlert: (payload: boolean) => void;
};

export type IColumnConfig = {
  [key: string]: string | null;
};

const ConfigForm = (props: IConfigFormProps) => {
  const { setConfig, config, isModalOpen, showResourceHelpAlert } = props;
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const { translate } = useTranslation();

  const onCloseAlert = () => {
    props?.actSetShouldShowResourceHelpAlert(false);
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
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    showResourceHelpAlert: state?.Preference?.showResourceHelpAlert,
  }),
  {
    actSetShouldShowResourceHelpAlert,
  },
)(ConfigForm);
