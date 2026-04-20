import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "antd";
import { useTranslation, sendOpenExternalLink } from "@/hook";
import { Wrapper } from "./style";

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        sendOpenExternalLink(href);
      }}
    >
      {children}
    </a>
  ),
};

type Props = {
  plan: string;
  onApprove: () => void;
  onReject: () => void;
};

const PlanReview = ({ plan, onApprove, onReject }: Props) => {
  const { translate } = useTranslation();

  return (
    <Wrapper>
      <div className="plan-review-header">
        <span className="plan-review-icon">📋</span>

        <div className="plan-review-title-block">
          <div className="plan-review-title">
            {translate("agent.planReviewTitle")}
          </div>
          <div className="plan-review-desc">
            {translate("agent.planReviewDesc")}
          </div>
        </div>
      </div>

      <div className="plan-review-body">
        <div className="plan-review-plan-box">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {plan}
          </ReactMarkdown>
        </div>
      </div>

      <div className="plan-review-actions">
        <Button danger size="small" onClick={onReject}>
          {translate("agent.planReject")}
        </Button>
        <Button type="primary" size="small" onClick={onApprove}>
          {translate("agent.planApprove")}
        </Button>
      </div>
    </Wrapper>
  );
};

export default PlanReview;
