import { NewTabIcon } from "@/component/Icon";
import { useOpenExternalLink } from "@/hook";
import { StatusWrapper } from "./style";

interface StatusProps {
  content: string;
  isSuccess?: boolean;
  style?: React.CSSProperties;
  isLarge?: boolean;
  onClick?: any;
  externalLink?: string;
  icon?: React.ReactNode;
}

const Status = (props: StatusProps) => {
  const { content, isSuccess, style, isLarge, onClick, externalLink, icon } =
    props;

  const { openExternalLink } = useOpenExternalLink();

  return (
    <StatusWrapper isSuccess={isSuccess} style={{ ...style }} isLarge={isLarge}>
      {icon && <div className="icon">{icon}</div>}

      <span className="text" onClick={onClick}>
        {content}
      </span>

      {externalLink && (
        <div className="link" onClick={() => openExternalLink(externalLink)}>
          <NewTabIcon />
        </div>
      )}
    </StatusWrapper>
  );
};

export default Status;
