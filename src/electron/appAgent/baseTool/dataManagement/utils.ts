import { IResourceGroup } from "@/electron/type";
import { resourceGroupDB } from "@/electron/database/resourceGroup";

const MAX_COLUMNS = 30;

export type ColumnDef = {
  name: string;
  type: "text" | "number" | "boolean";
  description?: string;
};

export const columnsToGroupFields = (
  columns: ColumnDef[],
): Record<string, string> => {
  const fields: Record<string, string> = {};
  columns.slice(0, MAX_COLUMNS).forEach((column, index) => {
    const num = index + 1;
    fields[`col${num}Variable`] = column.name;
    fields[`col${num}Label`] = column.description || column.name;
  });
  return fields;
};

export const groupToColumns = (group: IResourceGroup): ColumnDef[] => {
  const columns: ColumnDef[] = [];
  for (let index = 1; index <= MAX_COLUMNS; index++) {
    const variableName = (group as any)[`col${index}Variable`];
    if (!variableName) {
      break;
    }
    columns.push({ name: variableName, type: "text" });
  }
  return columns;
};

export const rowToResourceFields = (
  row: Record<string, any>,
  columns: ColumnDef[],
  groupId: number,
): Record<string, any> => {
  const fields: Record<string, any> = { groupId };
  columns.slice(0, MAX_COLUMNS).forEach((column, index) => {
    const num = index + 1;
    const value = row[column.name];
    fields[`col${num}`] =
      value !== undefined && value !== null ? String(value) : null;
  });
  return fields;
};

export const resolveResourceGroup = async ({
  groupId,
  groupName,
}: {
  groupId?: number;
  groupName?: string;
}): Promise<IResourceGroup> => {
  if (groupId) {
    const [group, err] = await resourceGroupDB.getOneResourceGroup(groupId);
    if (err) {
      throw new Error(`Failed to fetch resource group: ${err.message}`);
    }
    if (!group) {
      throw new Error(`Resource group with id ${groupId} not found`);
    }
    return group;
  }

  if (groupName) {
    const [result, err] = await resourceGroupDB.getListResourceGroup(
      1,
      100,
      groupName,
    );
    if (err || !result) {
      throw new Error(`Failed to search resource groups: ${err?.message}`);
    }
    const match = result.data.find(
      (group) => group.name?.toLowerCase() === groupName.toLowerCase(),
    );
    if (!match) {
      throw new Error(`Resource group "${groupName}" not found`);
    }
    return match;
  }

  throw new Error("groupId or groupName is required");
};

export const resourceToRow = (
  resource: Record<string, any>,
  columns: ColumnDef[],
): Record<string, any> => {
  const row: Record<string, any> = {};
  columns.slice(0, MAX_COLUMNS).forEach((column, index) => {
    const num = index + 1;
    row[column.name] = resource[`col${num}`] ?? null;
  });
  return row;
};
