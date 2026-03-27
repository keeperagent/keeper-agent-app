import { dialog, BrowserWindow } from "electron";

export enum ApprovalResult {
  APPROVED = "approved",
  DENIED = "denied",
}

/**
 * Show a native dialog asking the user to approve a write tool call from an external MCP client.
 * Returns "approved" if the user clicks Approve, "denied" otherwise.
 */
const showApprovalDialog = async (
  tokenName: string,
  toolName: string,
  toolDescription: string,
  argsText: string,
): Promise<ApprovalResult> => {
  const win =
    BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

  const message = `External agent "${tokenName}" wants to execute:\n\n${toolName}\n${toolDescription}`;
  const detail = argsText ? `Arguments:\n${argsText}` : undefined;

  const result = await dialog.showMessageBox(win!, {
    type: "info",
    title: "Keeper MCP — Approve action",
    message,
    detail,
    buttons: ["Approve", "Deny"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  return result.response === 0
    ? ApprovalResult.APPROVED
    : ApprovalResult.DENIED;
};

export { showApprovalDialog };
