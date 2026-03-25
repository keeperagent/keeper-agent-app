import { BrowserWindow } from "electron";
import { MESSAGE } from "@/electron/constant";
import { IMcpConnection } from "@/electron/type";

/**
 * Tracks live MCP connections keyed by a unique connectionId.
 * Each entry holds the MCP token metadata so the UI can display connected MCP clients.
 */
class ConnectionTracker {
  private connections = new Map<string, IMcpConnection>();

  add = (connectionId: string, connection: IMcpConnection) => {
    this.connections.set(connectionId, connection);
    this.broadcast();
  };

  remove = (connectionId: string) => {
    this.connections.delete(connectionId);
    this.broadcast();
  };

  getAll = (): IMcpConnection[] => {
    return Array.from(this.connections.values());
  };

  getConnectionIdsByTokenId = (tokenId: number): string[] => {
    const result: string[] = [];
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.tokenId === tokenId) {
        result.push(connectionId);
      }
    }

    return result;
  };

  private broadcast = () => {
    const windows = BrowserWindow.getAllWindows();

    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(MESSAGE.MCP_CONNECTIONS_UPDATED, {
          data: this.getAll(),
        });
      }
    }
  };
}

export const connectionTracker = new ConnectionTracker();
