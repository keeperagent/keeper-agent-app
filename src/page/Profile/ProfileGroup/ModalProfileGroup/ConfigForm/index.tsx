import { useEffect, useMemo, useState } from "react";
import { Select, Button, Tag } from "antd";
import { connect } from "react-redux";
import { Empty } from "antd";
import { deleteItemInList } from "@/service/util";
import { RootState } from "@/redux/store";
import {
  useGetListWalletGroup,
  useGetListResourceGroup,
  useTranslation,
} from "@/hook";
import { IResourceGroup, IWalletGroup } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import ProfileConfigChart from "../../../ProfileConfigChart";
import { FormWrapper, OptionWrapper } from "./style";

const { Option } = Select;
let searchWalletGroupTimeOut: any = null;
let searchResourceGroupTimeOut: any = null;

type IFormProps = {
  listWalletGroup: IWalletGroup[];
  listResourceGroup: IResourceGroup[];
  walletGroupId: number | null;
  setWalletGroupId: (value: number | null) => void;
  listResourceGroupId: number[];
  setListResourceGroupId: (value: number[]) => void;
};

const ConfigForm = (props: IFormProps) => {
  const { translate } = useTranslation();
  const {
    listWalletGroup,
    listResourceGroup,
    walletGroupId,
    setWalletGroupId,
    listResourceGroupId,
    setListResourceGroupId,
  } = props;
  const [walletGroup, setWalletGroup] = useState<string | undefined>();
  const [resourceGroup, setResourceGroup] = useState<string | undefined>();

  const { getListWalletGroup } = useGetListWalletGroup();
  const { getListResourceGroup } = useGetListResourceGroup();

  useEffect(() => {
    getListWalletGroup({ page: 1, pageSize: 1000 });
    getListResourceGroup({ page: 1, pageSize: 1000 });
  }, []);

  const onChangeWalletGroup = (value: string) => {
    setWalletGroup(value);
  };

  const onChangeResourceGroup = (value: string) => {
    setResourceGroup(value);
  };

  const onAddWalletGroup = () => {
    if (walletGroup) {
      setWalletGroupId(Number(walletGroup));
    }

    setWalletGroup(undefined);
  };

  const onRemoveWalletGroup = () => {
    setWalletGroupId(null);
  };

  const onAddResourceGroup = () => {
    if (resourceGroup && !listResourceGroupId?.includes(+resourceGroup)) {
      setListResourceGroupId([...listResourceGroupId, +resourceGroup]);
    }

    setResourceGroup(undefined);
  };

  const onRemoveResourceGroup = (id: number) => {
    const tempListData = [...listResourceGroupId];
    const index = tempListData?.indexOf(id);
    if (index !== -1) {
      setListResourceGroupId(deleteItemInList(index, tempListData));
    }
  };

  const listSelectedWalletGroup = useMemo(() => {
    return listWalletGroup?.filter(
      (group: IWalletGroup) => walletGroupId === group?.id,
    );
  }, [listWalletGroup, walletGroupId]);

  const listSelectedResourceGroup = useMemo(() => {
    return listResourceGroup?.filter((group: IResourceGroup) =>
      listResourceGroupId?.includes(group?.id!),
    );
  }, [listResourceGroup, listResourceGroupId]);

  const onSearchWalletGroup = (text: string) => {
    if (searchWalletGroupTimeOut) {
      clearTimeout(searchWalletGroupTimeOut);
    }
    searchWalletGroupTimeOut = setTimeout(() => {
      getListWalletGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onSearchResourceGroup = (text: string) => {
    if (searchResourceGroupTimeOut) {
      clearTimeout(searchResourceGroupTimeOut);
    }
    searchResourceGroupTimeOut = setTimeout(() => {
      getListResourceGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  return (
    <FormWrapper>
      <div className="label">
        {translate("wallet.walletGroup")} & {translate("resource.resource")}
      </div>
      <div className="select">
        <div className="item">
          <Select
            className="custom-select"
            placeholder={translate("wallet.selectedWalletGroup")}
            value={walletGroup}
            onChange={onChangeWalletGroup}
            allowClear
            size="middle"
            showSearch
            onSearch={onSearchWalletGroup}
            filterOption={false}
            optionLabelProp="label"
          >
            {listWalletGroup
              ?.filter((group: IWalletGroup) => walletGroupId !== group?.id)
              ?.map((group: IWalletGroup) => (
                <Option key={group?.id} value={group?.id} label={group?.name}>
                  <OptionWrapper>
                    <div className="name">{group?.name || EMPTY_STRING}</div>
                    <div className="description">
                      {group?.note || EMPTY_STRING}
                    </div>
                  </OptionWrapper>
                </Option>
              ))}
          </Select>

          <Button
            size="middle"
            type="primary"
            className="btn"
            disabled={walletGroup === undefined}
            onClick={onAddWalletGroup}
          >
            {listSelectedWalletGroup.length > 0
              ? translate("edit")
              : translate("add")}
          </Button>
        </div>

        <div className="item">
          <Select
            className="custom-select"
            placeholder={translate("resource.selectResource")}
            value={resourceGroup}
            onChange={onChangeResourceGroup}
            allowClear
            size="middle"
            showSearch
            onSearch={onSearchResourceGroup}
            filterOption={false}
            optionLabelProp="label"
          >
            {listResourceGroup
              ?.filter(
                (group: IResourceGroup) =>
                  !listResourceGroupId?.includes(group?.id!),
              )
              ?.map((group: IResourceGroup) => (
                <Option key={group?.id} value={group?.id} label={group?.name}>
                  <OptionWrapper>
                    <div className="name">{group?.name || EMPTY_STRING}</div>
                    <div className="description">
                      {group?.note || EMPTY_STRING}
                    </div>
                  </OptionWrapper>
                </Option>
              ))}
          </Select>

          <Button
            size="middle"
            type="primary"
            className="btn"
            disabled={resourceGroup === undefined}
            onClick={onAddResourceGroup}
          >
            {translate("add")}
          </Button>
        </div>
      </div>

      <div className="list-item">
        {listSelectedWalletGroup?.map((group: IWalletGroup, index: number) => (
          <Tag key={index} onClose={onRemoveWalletGroup} closable color="green">
            {group?.name}
          </Tag>
        ))}

        {listSelectedResourceGroup?.map(
          (group: IResourceGroup, index: number) => (
            <Tag
              key={index}
              onClose={() => onRemoveResourceGroup(group?.id!)}
              closable
              color="gold"
            >
              {group?.name}
            </Tag>
          ),
        )}
      </div>

      {listSelectedResourceGroup.length + listSelectedWalletGroup.length > 0 ? (
        <div className="chart">
          <ProfileConfigChart
            listResourceGroup={listSelectedResourceGroup}
            listWalletGroup={listSelectedWalletGroup}
          />
        </div>
      ) : (
        <div className="empty">
          <Empty />
        </div>
      )}
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    listResourceGroup: state?.ResourceGroup?.listResourceGroup,
  }),
  {},
)(ConfigForm);
