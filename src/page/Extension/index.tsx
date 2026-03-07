import { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Empty } from "antd";
import { RootState } from "@/redux/store";
import { UploadButton } from "@/component/Button";
import { actSetPageName } from "@/redux/layout";
import { SearchInput } from "@/component/Input";
import { IExtension } from "@/electron/type";
import { useGetListExtension, useTranslation } from "@/hook";
import ExtensionItem from "./ExtensionItem";
import ModalImportExtension from "./ModalImportExtension";
import { PageWrapper } from "./style";

let searchTimeOut: any = null;

type IPageProps = {
  listExtension: IExtension[];
  actSetPageName: (payload: string) => void;
};

const ExtensionPage = (props: IPageProps) => {
  const { translate } = useTranslation();
  const { listExtension } = props;
  const [searchText, onSetSearchText] = useState("");
  const [isModalImportOpen, setModalImportOpen] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(false);

  const { getListExtension } = useGetListExtension();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.extension"));
  }, [translate]);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListExtension({
        searchText,
      });
    }, 200);
  }, [searchText]);

  useEffect(() => {
    if (shouldRefetch) {
      getListExtension({
        searchText,
      });
      setShouldRefetch(false);
    }
  }, [shouldRefetch, searchText]);

  const onOpenModalImport = () => {
    setModalImportOpen(true);
  };

  return (
    <PageWrapper>
      <title>{translate("sidebar.extension")}</title>

      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{
            marginRight: "auto",
            width: "35rem",
          }}
        />

        <UploadButton
          text="Import"
          isUploadButton={false}
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalImport}
        />
      </div>

      {listExtension?.length > 0 ? (
        <div className="list">
          {listExtension.map((extension: IExtension, index: number) => (
            <div className="item" key={index}>
              <ExtensionItem
                extension={extension}
                searchText={searchText}
                setShouldRefetch={setShouldRefetch}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Empty />
        </div>
      )}

      <ModalImportExtension
        isModalOpen={isModalImportOpen}
        setModalOpen={setModalImportOpen}
        setShouldRefetch={setShouldRefetch}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listExtension: state?.Extension?.listExtension,
    totalData: state?.Extension?.totalData,
  }),
  { actSetPageName },
)(ExtensionPage);
