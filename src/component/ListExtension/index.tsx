import { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Select, Button, Empty } from "antd";
import { RootState } from "@/redux/store";
import { deleteItemInList } from "@/service/util";
import { IExtension } from "@/electron/type";
import { useGetListExtension, useTranslation } from "@/hook";
import { EMPTY_STRING } from "@/config/constant";
import ExtensionItem from "./ExtensionItem";
import { ListWrapper, OptionWrapper } from "./style";

const { Option } = Select;
let searchTimeOut: any = null;

type IListExtensionProps = {
  listExtension: IExtension[];
  listSelectedId: number[];
  setListSelectedId: (value: number[]) => void;
};

const ListExtension = (props: IListExtensionProps) => {
  const { translate } = useTranslation();
  const { listExtension, listSelectedId, setListSelectedId } = props;
  const [value, setValue] = useState<number | undefined>(undefined);

  const listOption = useMemo(() => {
    return listExtension?.filter(
      (extension: IExtension) => !listSelectedId?.includes(extension?.id!),
    );
  }, [listExtension, listSelectedId]);

  const { getListExtension } = useGetListExtension();

  useEffect(() => {
    getListExtension({});
  }, []);

  const onChangeExtension = (current: number) => {
    setValue(current);
  };

  const onAddExtension = () => {
    if (value !== undefined && !listSelectedId?.includes(Number(value))) {
      setListSelectedId([Number(value), ...listSelectedId]);
    }

    setValue(undefined);
  };

  const onRemoveExtension = (id: number) => {
    const tempListData = [...listSelectedId];
    const index = tempListData?.indexOf(id);
    if (index !== -1) {
      setListSelectedId(deleteItemInList(index, tempListData));
    }
  };

  const onSearchExtension = (text: string) => {
    if (searchTimeOut) {
      clearTimeout(searchTimeOut);
    }
    searchTimeOut = setTimeout(() => {
      getListExtension({ searchText: text });
    }, 200);
  };

  return (
    <ListWrapper>
      <div className="search">
        <Select
          className="custom-select"
          placeholder={translate("extension.selectExtension")}
          value={value}
          onChange={onChangeExtension}
          allowClear
          showSearch
          onSearch={onSearchExtension}
          filterOption={false}
          size="large"
        >
          {listOption?.map((extension: IExtension) => (
            <Option
              key={extension?.id}
              value={extension?.id}
              label={extension?.name}
            >
              <OptionWrapper>
                <div className="logo">
                  <img src={extension?.iconPath} alt="" />
                </div>
                <div className="name">{extension?.name || EMPTY_STRING}</div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        <Button
          size="middle"
          type="primary"
          className="btn"
          disabled={value === undefined}
          onClick={onAddExtension}
        >
          {translate("button.add")}
        </Button>
      </div>

      {listSelectedId.length > 0 ? (
        <div className="list">
          {listExtension
            ?.filter((extension: IExtension) =>
              listSelectedId?.includes(extension?.id!),
            )
            .map((extension: IExtension, index: number) => (
              <div className="item" key={index}>
                <ExtensionItem
                  extension={extension}
                  onRemoveExtension={onRemoveExtension}
                />
              </div>
            ))}
        </div>
      ) : (
        <div className="empty">
          <Empty />
        </div>
      )}
    </ListWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listExtension: state?.Extension?.listExtension,
  }),
  {},
)(ListExtension);
