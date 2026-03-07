import _ from "lodash";

const MIN_PAGE_SIZE = 1;
export const DEFAULT_PAGE_SIZE = 30;
export const safePageSize = (value: number): number => {
  const pageSize = value || DEFAULT_PAGE_SIZE;
  return pageSize < MIN_PAGE_SIZE ? MIN_PAGE_SIZE : pageSize;
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
