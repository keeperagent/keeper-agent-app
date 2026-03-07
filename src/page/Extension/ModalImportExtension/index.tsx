import { useEffect, useMemo, useState } from "react";
import { Modal, Input, Form, Alert, message, Progress } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadFile, TagOption, Code } from "@/component";
import { FILE_TYPE } from "@/config/constant";
import {
  useImportExtension,
  useTranslation,
  useCreateBaseProfileExtension,
} from "@/hook";
import { IFile } from "@/types/interface";
import { ModalWrapper, HelpWrapper } from "./style";

const { TextArea } = Input;

const IMPORT_MODE = {
  FROM_FILE: "FROM_FILE",
  FROM_LINK: "FROM_LINK",
};

const ModalImportWallet = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const [mode, setMode] = useState(IMPORT_MODE.FROM_LINK);
  const [form] = Form.useForm();

  const {
    importExtension,
    loading: loadingImportExtension,
    mapErrorWithFile,
    isSuccess,
    isUploaded,
    isGetExtensionId,
    isGetExtensionIdSuccess,
    downloadedPercentage,
    error,
  } = useImportExtension();

  const { isLoadingCreateBase, createBaseProfileExtension } =
    useCreateBaseProfileExtension();

  useEffect(() => {
    setListFile([]);
    form?.setFieldsValue({
      link: "",
    });
  }, [isModalOpen]);

  useEffect(() => {
    if (!loadingImportExtension && isSuccess) {
      onCloseModal();
      props?.setShouldRefetch(true);

      // if all extension is imported, create base profile
      createBaseProfileExtension();
    }

    if (!loadingImportExtension && isSuccess !== null) {
      props?.setShouldRefetch(true);
    }
  }, [loadingImportExtension, isSuccess]);

  useEffect(() => {
    if (isGetExtensionId) {
      message.warning(translate("extension.gettingExtensionId"));
      if (isGetExtensionIdSuccess) {
        message.destroy();
        message.success(translate("extension.successGetId"));
      }
    }
  }, [isGetExtensionId, loadingImportExtension, isGetExtensionIdSuccess]);

  const onCloseModal = () => {
    setModalOpen(false);
  };

  const onSubmitForm = async () => {
    if (mode === IMPORT_MODE.FROM_FILE) {
      importExtension(
        listFile?.map((file: IFile, index: number) => ({ ...file, index })),
      );
    } else if (mode === IMPORT_MODE.FROM_LINK) {
      try {
        const { link } = await form.validateFields(["link"]);
        importExtension([{ link }]);
      } catch {}
    }
  };

  const loading = useMemo(() => {
    return loadingImportExtension || isLoadingCreateBase;
  }, [loadingImportExtension, isLoadingCreateBase]);

  return (
    <Modal
      open={isModalOpen}
      title="Import extension"
      onCancel={onCloseModal}
      maskClosable={false}
      okText={
        loading && mode === IMPORT_MODE.FROM_LINK
          ? translate("extension.downloading")
          : "Import"
      }
      cancelText={translate("cancel")}
      width="45rem"
      onOk={onSubmitForm}
      confirmLoading={loading}
    >
      <ModalWrapper>
        <div className="mode">
          <TagOption
            content={translate("extension.importFromLink")}
            checked={mode === IMPORT_MODE.FROM_LINK}
            onClick={() => setMode(IMPORT_MODE.FROM_LINK)}
          />

          <TagOption
            content={translate("extension.importFromFile")}
            checked={mode === IMPORT_MODE.FROM_FILE}
            onClick={() => setMode(IMPORT_MODE.FROM_FILE)}
          />
        </div>

        {mode === IMPORT_MODE.FROM_FILE ? (
          <UploadFile
            listFile={listFile}
            setListFile={setListFile}
            listExt={[FILE_TYPE.ZIP, FILE_TYPE.CRX]}
            mapErrorWithFile={mapErrorWithFile}
            isUploaded={isUploaded}
          />
        ) : (
          <Form
            layout="vertical"
            form={form}
            style={{ marginTop: "2rem", width: "100%" }}
          >
            <Form.Item
              label="Link extension:"
              name="link"
              rules={[
                {
                  validator(_, value) {
                    const storeLinkRegex =
                      /^https:\/\/chromewebstore\.google\.com\/detail\/[\w-]+\/([\w-]{32})\??.*$/;
                    const isValidUrl = storeLinkRegex.test(value);
                    if (!isValidUrl) {
                      return Promise.reject(
                        Error(translate("extension.validateLinkExtension")),
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <TextArea
                placeholder={translate("extension.enterLinkExtension")}
                rows={4}
                className="custom-input"
              />
            </Form.Item>

            <Alert
              message={
                <HelpWrapper>
                  <div className="title">
                    {translate("extension.egDownloadRabby")}{" "}
                    {translate("pleaseEnter")}:
                  </div>

                  <Code
                    text="https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch"
                    isWithCopy={true}
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem 0.7rem",
                      marginLeft: "0",
                      marginRight: "0",
                    }}
                  />
                </HelpWrapper>
              }
              type="info"
              className="help"
            />

            {loading && downloadedPercentage > 0 && (
              <Progress
                percent={downloadedPercentage}
                strokeColor="var(--color-success)"
                trailColor="var(--background-success)"
                strokeLinecap="butt"
                status="active"
                style={{ marginTop: "2rem" }}
              />
            )}

            {error && (
              <Alert
                message={`Error: ${error}`}
                type="error"
                showIcon
                style={{ marginTop: "1rem" }}
              />
            )}
          </Form>
        )}
      </ModalWrapper>
    </Modal>
  );
};

export default connect((_state: RootState) => ({}), {})(ModalImportWallet);
