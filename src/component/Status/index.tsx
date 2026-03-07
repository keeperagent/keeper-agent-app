import { NewTabIcon } from "@/component/Icon";
import { MESSAGE } from "@/electron/constant";
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

  const onOpenLink = () => {
    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url: externalLink,
    });
  };

  return (
    <StatusWrapper isSuccess={isSuccess} style={{ ...style }} isLarge={isLarge}>
      {icon && <div className="icon">{icon}</div>}

      <span className="text" onClick={onClick}>
        {content}
      </span>

      {externalLink && (
        <div className="link" onClick={onOpenLink}>
          <NewTabIcon />
        </div>
      )}
    </StatusWrapper>
  );
};

export default Status;
