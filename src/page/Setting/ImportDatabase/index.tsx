import { useState } from "react";
import { Row, Alert, Spin } from "antd";
import { UploadFile } from "@/component";
import { UploadButton } from "@/component/Button";
import { FILE_TYPE } from "@/config/constant";
import { IFile } from "@/types/interface";
import { useImportDatabase, useTranslation } from "@/hook";
import { Wrapper } from "./style";

const ImportDatabase = () => {
  const { translate } = useTranslation();
  const [listFile, setListFile] = useState<IFile[]>([]);
  const { importDatabase, loading } = useImportDatabase();

  const onSubmit = () => {
    if (listFile?.[0]?.path) {
      importDatabase({ filePath: listFile[0]?.path });
    }
  };

  return (
    <Spin spinning={loading}>
      <Wrapper>
        <UploadFile
          listFile={listFile}
          setListFile={setListFile}
          listExt={[FILE_TYPE.TXT]}
          mapErrorWithFile={{}}
          single={true}
        />

        <Alert
          title={translate("setting.importDatabaseHelpText")}
          type="warning"
          showIcon
          style={{ marginTop: "var(--margin-top)" }}
        />

        <Row justify="end">
          <UploadButton
            text={translate("sync")}
            isUploadButton={false}
            style={{ marginTop: "var(--margin-top)" }}
            onClick={onSubmit}
          />
        </Row>
      </Wrapper>
    </Spin>
  );
};

export default ImportDatabase;
