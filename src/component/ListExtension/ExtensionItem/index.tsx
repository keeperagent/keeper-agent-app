import { useMemo } from "react";
import { CloseIcon } from "@/component/Icon";
import { IExtension } from "@/electron/type";
import { ItemWrapper } from "./style";

type IExtensionItemProps = {
  extension: IExtension;
  onRemoveExtension: (value: number) => void;
};

const ExtensionItem = (props: IExtensionItemProps) => {
  const { extension, onRemoveExtension } = props;

  const formattedDes = useMemo(() => {
    if (!extension?.description) {
      return "";
    }

    const MAX_LENGTH = 48;
    return extension?.description?.length < MAX_LENGTH
      ? extension?.description
      : extension?.description?.slice(0, MAX_LENGTH) + "...";
  }, [extension?.description]);

  return (
    <ItemWrapper>
      <div className="logo">
        <img src={extension?.iconPath} alt="" />
      </div>
      <div className="info">
        <div className="name">{extension?.name || ""}</div>
        <div className="description">{formattedDes}</div>
      </div>

      <div className="close" onClick={() => onRemoveExtension(extension?.id!)}>
        <CloseIcon />
      </div>
    </ItemWrapper>
  );
};

export default ExtensionItem;
