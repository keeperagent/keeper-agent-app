import { Tooltip } from "antd";
import { IKeyValue } from "@/electron/type";
import { deleteItemInList, updateItemInList } from "@/service/util";
import { PlusIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { KeyValue } from "./KeyValue";
import { ListWrapper } from "./style";

type IProps = {
  listKeyValue: IKeyValue[];
  setListKeyValue: (listKeyValue: IKeyValue[]) => void;
};

const ListKeyValue = (props: IProps) => {
  const { listKeyValue, setListKeyValue } = props;
  const { translate } = useTranslation();

  const onAddKeyValue = () => {
    setListKeyValue([...listKeyValue, { key: "", value: "" }]);
  };

  const onRemoveKeyValue = (index: number) => {
    setListKeyValue(deleteItemInList(index, listKeyValue));
  };

  const onChangeKeyValue = (keyValue: IKeyValue, index: number) => {
    setListKeyValue(updateItemInList(index, listKeyValue, keyValue));
  };

  return (
    <ListWrapper>
      {listKeyValue?.map((keyValue, index) => (
        <KeyValue
          key={index}
          index={index}
          keyValue={keyValue}
          onChangeKeyValue={onChangeKeyValue}
          onRemoveKeyValue={onRemoveKeyValue}
        />
      ))}

      <div className="add">
        <Tooltip title={translate("add")}>
          <div className="icon" onClick={onAddKeyValue}>
            <PlusIcon />
          </div>
        </Tooltip>
      </div>
    </ListWrapper>
  );
};

export { ListKeyValue };
