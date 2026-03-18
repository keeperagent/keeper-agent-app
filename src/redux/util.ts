import _ from "lodash";
import { TABLE_PAGE_OPTION } from "@/config/constant";

export const DEFAULT_PAGE_SIZE = TABLE_PAGE_OPTION[0];
export const getNewPageSize = (
  oldPageSize: number,
  newPageSize: number,
): number => {
  return TABLE_PAGE_OPTION?.includes(newPageSize) ? newPageSize : oldPageSize;
};

const updateOrDelete = (id: number, listData: any[], data?: any) => {
  const tempListData = [...listData];
  const indexOfData = _.findIndex(tempListData, { id });

  if (indexOfData !== -1) {
    // if data is not provided, it mean 'delete this @id'
    if (typeof data === "undefined") {
      tempListData.splice(indexOfData, 1);
    } else {
      tempListData.splice(indexOfData, 1, data);
    }
  }

  return tempListData;
};

export { updateOrDelete };
