import { useNavigate } from "react-router-dom";
import { useOpenExternalLink } from "@/hook";
import { HoverLinkWrapper } from "./style";

type IProps = {
  prefixString?: string;
  postString?: string;
  textLink?: string;
  link?: string;
  style?: React.CSSProperties;
  isOpenNewTab?: boolean;
};

const HoverLink = (props: IProps) => {
  const {
    prefixString,
    postString,
    link = "#",
    textLink,
    style,
    isOpenNewTab,
  } = props;

  const navigate = useNavigate();
  const { openExternalLink } = useOpenExternalLink();

  const onOpenLink = () => {
    if (!isOpenNewTab) {
      navigate(link);
    } else {
      openExternalLink(link);
    }
  };

  return (
    <HoverLinkWrapper style={style}>
      {prefixString}

      <span className="link" onClick={onOpenLink}>
        {textLink}

        <svg viewBox="0 0 70 36">
          <path d="M6.9739 30.8153H63.0244C65.5269 30.8152 75.5358 -3.68471 35.4998 2.81531C-16.1598 11.2025 0.894099 33.9766 26.9922 34.3153C104.062 35.3153 54.5169 -6.68469 23.489 9.31527" />
        </svg>
      </span>

      {postString}
    </HoverLinkWrapper>
  );
};

export default HoverLink;
