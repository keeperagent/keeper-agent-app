import { useState } from "react";
import { Modal } from "antd";
import { TagOption } from "@/component";
import { ModalWrapper } from "./style";
import CreateManual from "./CreateManual";
import AutoGenerate from "./AutoGenerate";
import FromPhrase from "./FromPhrase";
import { useTranslation } from "@/hook";

const CREATE_MODE = {
  MANUAL: "MANUAL",
  AUTO_GENERATE: "AUTO_GENERATE",
  FROM_PHRASE: "FROM_PHRASE",
};

const ModalCreateWallet = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, setShouldRefetch } = props;
  const [mode, setMode] = useState(CREATE_MODE.MANUAL);

  const onCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <Modal
      onCancel={onCloseModal}
      open={isModalOpen}
      maskClosable={false}
      title={translate("wallet.createWallet")}
      width="50rem"
      footer={null}
      style={{ top: "6rem" }}
      destroyOnHidden={true}
    >
      <ModalWrapper>
        <div className="mode">
          <TagOption
            content={translate("wallet.manualCreate")}
            checked={mode === CREATE_MODE.MANUAL}
            onClick={() => setMode(CREATE_MODE.MANUAL)}
          />

          <TagOption
            content={translate("wallet.autoCreate")}
            checked={mode === CREATE_MODE.AUTO_GENERATE}
            onClick={() => setMode(CREATE_MODE.AUTO_GENERATE)}
          />

          <TagOption
            content={translate("wallet.createFromPhrase")}
            checked={mode === CREATE_MODE.FROM_PHRASE}
            onClick={() => setMode(CREATE_MODE.FROM_PHRASE)}
          />
        </div>

        <div className="content">
          {mode === CREATE_MODE.MANUAL && (
            <CreateManual
              setModalOpen={setModalOpen}
              isModalOpen={isModalOpen}
            />
          )}

          {mode === CREATE_MODE.AUTO_GENERATE && (
            <AutoGenerate
              setModalOpen={setModalOpen}
              isModalOpen={isModalOpen}
              setShouldRefetch={setShouldRefetch}
            />
          )}

          {mode === CREATE_MODE.FROM_PHRASE && (
            <FromPhrase
              setModalOpen={setModalOpen}
              isModalOpen={isModalOpen}
              setShouldRefetch={setShouldRefetch}
            />
          )}
        </div>
      </ModalWrapper>
    </Modal>
  );
};

export default ModalCreateWallet;
