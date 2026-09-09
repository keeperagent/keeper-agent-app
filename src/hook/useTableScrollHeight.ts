import { useEffect, useRef, useState } from "react";

const DEFAULT_TABLE_BOTTOM_SPACING_PX = 100;
const DEFAULT_MIN_TABLE_SCROLL_HEIGHT_PX = 200;

type IUseTableScrollHeightOptions = {
  bottomSpacingPx?: number;
  minHeightPx?: number;
  deps?: any[];
};

const useTableScrollHeight = (options?: IUseTableScrollHeightOptions) => {
  const bottomSpacingPx =
    options?.bottomSpacingPx || DEFAULT_TABLE_BOTTOM_SPACING_PX;
  const minHeightPx =
    options?.minHeightPx || DEFAULT_MIN_TABLE_SCROLL_HEIGHT_PX;
  const deps = options?.deps || [];

  const tableSectionRef = useRef<HTMLDivElement>(null);
  const [scrollHeight, setScrollHeight] = useState(minHeightPx);

  useEffect(() => {
    const container = tableSectionRef.current;
    if (!container) {
      return () => {};
    }

    const recomputeScrollHeight = () => {
      const headerHeight =
        container.querySelector<HTMLElement>(".ant-table-header")
          ?.offsetHeight || 0;
      const paginationHeight =
        container.querySelector<HTMLElement>(".ant-table-pagination")
          ?.offsetHeight || 0;
      const nextScrollHeight =
        container.clientHeight -
        headerHeight -
        paginationHeight -
        bottomSpacingPx;
      setScrollHeight(Math.max(nextScrollHeight, minHeightPx));
    };

    recomputeScrollHeight();
    const observer = new ResizeObserver(recomputeScrollHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, deps);

  return { tableSectionRef, scrollHeight };
};

export { useTableScrollHeight };
