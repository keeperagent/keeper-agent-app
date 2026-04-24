import { randomUUID } from "crypto";
import { codexCliAuth } from "./codexCliAuth";

class CodexCliTransport {
  private sessionId = randomUUID();

  createCodexFetch = (): typeof fetch => {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const accessToken = await codexCliAuth.getAccessToken();
      const config = codexCliAuth.loadConfig();

      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      headers.set("authorization", `Bearer ${accessToken}`);
      headers.set("originator", config.originator);
      headers.set("session_id", this.sessionId);

      return fetch(input, { ...init, headers });
    };
  };
}

const codexCliTransport = new CodexCliTransport();
export { codexCliTransport };
