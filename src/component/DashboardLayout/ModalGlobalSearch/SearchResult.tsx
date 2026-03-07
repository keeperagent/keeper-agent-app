import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { actSetModalGlobalSearchOpen } from "@/redux/layout";
import { RootState } from "@/redux/store";
import { formatTime, trimText } from "@/service/util";
import { useTranslation } from "@/hook";
import { SearchResultWrapper } from "./style";

type ISearchResultProps = {
  name: string;
  description: string;
  updateAt: number;
  totalData?: number;
  link: string;
  totalLabel?: string;
  actSetModalGlobalSearchOpen: (payload: boolean) => void;
};

const SearchResult = (props: ISearchResultProps) => {
  const { name, description, updateAt, totalData, link, totalLabel } = props;
  const { translate } = useTranslation();
  const navigate = useNavigate();

  const onClick = () => {
    props?.actSetModalGlobalSearchOpen(false);
    navigate(link);
  };

  return (
    <SearchResultWrapper onClick={onClick}>
      <div className="name">{trimText(name, 35)}</div>
      <div className="description">{trimText(description, 40)}</div>

      <div className="update-at">
        <div className="label">{translate("updatedAt")}</div>:
        <div className="value">{formatTime(Number(updateAt))}</div>
      </div>

      {totalLabel && (
        <div className="total-data">
          <div className="label">{totalLabel}</div>:
          <div className="value">{totalData}</div>
        </div>
      )}
    </SearchResultWrapper>
  );
};

export default connect((_state: RootState) => ({}), {
  actSetModalGlobalSearchOpen,
})(SearchResult);
