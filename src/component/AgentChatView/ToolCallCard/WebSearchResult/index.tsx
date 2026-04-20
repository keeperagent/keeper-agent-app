import { useOpenExternalLink } from "@/hook";
import { ToolCallStateStatus } from "../../util";
import {
  extractDomain,
  getFaviconUrl,
  normalizeUrl,
  type WebSearchResultItem,
} from "../util";
import { WebSearchResultList, WebSearchResultRow } from "./style";

type WebSearchResultProps = {
  items: WebSearchResultItem[];
  extractWebStateMap?: Map<string, ToolCallStateStatus>;
};

const WebSearchResult = ({
  items,
  extractWebStateMap,
}: WebSearchResultProps) => {
  const { openExternalLink } = useOpenExternalLink();

  return (
    <WebSearchResultList>
      {items.map((item, index) => {
        const extractWebState = extractWebStateMap?.get(normalizeUrl(item.url));

        return (
          <WebSearchResultRow
            key={index}
            onClick={() => openExternalLink(item.url)}
          >
            <img
              className="favicon"
              src={getFaviconUrl(item.url)}
              alt=""
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="title">{item.title}</span>

            {extractWebState === ToolCallStateStatus.RUNNING && (
              <span className="extract-spinner" />
            )}
            {extractWebState === ToolCallStateStatus.DONE && (
              <span className="extract-done" />
            )}

            <span className="domain">{extractDomain(item.url)}</span>
          </WebSearchResultRow>
        );
      })}
    </WebSearchResultList>
  );
};

export default WebSearchResult;
