import { createHash, randomUUID } from "crypto";
import { claudeCliAuth } from "./claudeCliAuth";

const sessionId = randomUUID();

type SystemEntry = { type: string; text: string } & Record<string, unknown>;
type ContentBlock = { type?: string; name?: string } & Record<string, unknown>;
type MessageContent = string | ContentBlock[];
type Message = { role?: string; content?: MessageContent };

class ClaudeCliTransport {
  private cliVersion = "2.1.119";
  private billingSalt = "59cf53e54c78";
  private systemIdentity =
    "You are Claude Code, Anthropic's official CLI for Claude.";
  private billingPrefix = "x-anthropic-billing-header";
  private toolPrefix = "mcp_";
  private baseBetas = [
    "claude-code-20250219",
    "oauth-2025-04-20",
    "interleaved-thinking-2025-05-14",
    "prompt-caching-scope-2026-01-05",
    "context-management-2025-06-27",
  ];
  private modelOverrides: Record<
    string,
    { exclude?: string[]; add?: string[] }
  > = {
    haiku: { exclude: ["interleaved-thinking-2025-05-14"] },
    "4-6": { add: ["effort-2025-11-24"] },
    "4-7": { add: ["effort-2025-11-24"] },
  };

  // Pull latest values from model-capability.json so users can edit them without a code change.
  private refreshConfig = () => {
    const config = claudeCliAuth.loadConfig();
    this.cliVersion = config.cliVersion;
    this.billingSalt = config.billingSalt;
    this.systemIdentity = config.systemIdentity;
    this.billingPrefix = config.billingPrefix;
    this.toolPrefix = config.toolPrefix;
    this.baseBetas = config.baseBetas;
    this.modelOverrides = config.modelOverrides;
  };

  createClaudeOAuthFetch = (
    accessToken: string,
    modelId: string,
  ): typeof fetch => {
    this.refreshConfig();
    const betas = this.getModelBetas(modelId);

    return async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const headers = new Headers();

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => headers.set(key, value));
        } else if (Array.isArray(init.headers)) {
          for (const [key, value] of init.headers) {
            headers.set(key, String(value));
          }
        } else {
          for (const [key, value] of Object.entries(init.headers)) {
            if (value !== undefined) {
              headers.set(key, String(value));
            }
          }
        }
      }

      headers.set("authorization", `Bearer ${accessToken}`);
      headers.set("anthropic-version", "2023-06-01");
      headers.set("anthropic-beta", betas.join(","));
      headers.set("x-app", "cli");
      headers.set(
        "user-agent",
        `claude-cli/${this.cliVersion} (external, cli)`,
      );
      headers.set("x-client-request-id", randomUUID());
      headers.set("x-claude-code-session-id", sessionId);
      headers.delete("x-api-key");

      let body = init?.body;
      if (typeof body === "string") {
        body = this.transformBody(body);
      }

      const response = await fetch(input, { ...init, headers, body });
      return this.transformResponseStream(response);
    };
  };

  // Each model requires a specific set of beta flags — wrong betas cause rejections or missing features.
  private getModelBetas = (modelId: string): string[] => {
    const betas = [...this.baseBetas];
    const lower = modelId.toLowerCase();

    for (const [pattern, override] of Object.entries(this.modelOverrides)) {
      if (lower.includes(pattern)) {
        if (override.exclude) {
          for (const excluded of override.exclude) {
            const index = betas.indexOf(excluded);
            if (index !== -1) {
              betas.splice(index, 1);
            }
          }
        }

        if (override.add) {
          for (const added of override.add) {
            if (!betas.includes(added)) {
              betas.push(added);
            }
          }
        }
        break;
      }
    }
    return betas;
  };

  // Injects billing header, splits/relocates system entries, and prefixes tool names before sending to the API.
  private transformBody = (body: string): string => {
    try {
      const parsed = JSON.parse(body) as {
        model?: string;
        system?: SystemEntry[];
        messages?: Message[];
        tools?: Array<{ name?: string } & Record<string, unknown>>;
      };

      if (!Array.isArray(parsed.system)) {
        parsed.system = [];
      }

      parsed.system = parsed.system.filter(
        (entry) =>
          !(entry.type === "text" && entry.text.startsWith(this.billingPrefix)),
      );

      const billingValue = this.buildBillingHeaderValue(parsed.messages || []);

      const splitSystem: SystemEntry[] = [];
      for (const entry of parsed.system) {
        if (
          entry.type === "text" &&
          entry.text.startsWith(this.systemIdentity) &&
          entry.text.length > this.systemIdentity.length
        ) {
          const rest = entry.text
            .slice(this.systemIdentity.length)
            .replace(/^\n+/, "");
          const { text: _text, ...entryProps } = entry;
          const { cache_control: _cc, ...identityProps } = entryProps;
          splitSystem.push({ ...identityProps, text: this.systemIdentity });

          if (rest.length > 0) {
            splitSystem.push({ ...entryProps, text: rest });
          }
        } else {
          splitSystem.push(entry);
        }
      }

      const keptSystem: SystemEntry[] = [];
      const movedTexts: string[] = [];
      for (const entry of splitSystem) {
        const text = entry.text ?? "";
        if (
          text.startsWith(this.billingPrefix) ||
          text.startsWith(this.systemIdentity)
        ) {
          keptSystem.push(entry);
        } else if (text.length > 0) {
          movedTexts.push(text);
        }
      }
      if (movedTexts.length > 0 && Array.isArray(parsed.messages)) {
        const firstUser = parsed.messages.find(
          (message) => message.role === "user",
        );

        if (firstUser) {
          parsed.system = keptSystem;
          const prefix = movedTexts.join("\n\n");
          if (typeof firstUser.content === "string") {
            firstUser.content = `${prefix}\n\n${firstUser.content}`;
          } else if (Array.isArray(firstUser.content)) {
            firstUser.content.unshift({ type: "text", text: prefix });
          }
        }
      }

      parsed.system = [{ type: "text", text: billingValue }, ...parsed.system];

      if (Array.isArray(parsed.tools)) {
        parsed.tools = parsed.tools.map((tool) => ({
          ...tool,
          name: tool.name ? this.prefixToolName(tool.name) : tool.name,
        }));
      }

      if (Array.isArray(parsed.messages)) {
        parsed.messages = parsed.messages.map((message) => {
          if (!Array.isArray(message.content)) {
            return message;
          }

          return {
            ...message,
            content: message.content.map((block) => {
              if (block.type !== "tool_use" || typeof block.name !== "string") {
                return block;
              }
              return { ...block, name: this.prefixToolName(block.name) };
            }),
          };
        });
      }

      if (Array.isArray(parsed.messages)) {
        parsed.messages = this.repairToolPairs(parsed.messages);
      }

      return JSON.stringify(parsed);
    } catch {
      return body;
    }
  };

  // Wraps the response stream to strip mcp_ tool name prefixes chunk-by-chunk before LangChain reads them.
  private transformResponseStream = (response: Response): Response => {
    if (!response.body) {
      return response;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      pull: async (controller) => {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const text = decoder.decode(value, { stream: true });
        controller.enqueue(encoder.encode(this.stripToolPrefixFromText(text)));
      },
    });

    return new Response(stream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };

  // This header must be system[0] on every request — it routes OAuth Bearer traffic into the Claude Code
  // billing tier (unlimited Sonnet). Without it, requests land in the Pro bucket and hit Sonnet rate limits.
  private buildBillingHeaderValue = (messages: Message[]): string => {
    const text = this.extractFirstUserMessageText(messages);
    const suffix = this.computeVersionSuffix(text, this.cliVersion);
    const cch = this.computeContentChecksum(text);
    return `${this.billingPrefix}: cc_version=${this.cliVersion}.${suffix}; cc_entrypoint=cli; cch=${cch};`;
  };

  // The billing header hashes are derived from the first user message text — not the full conversation.
  private extractFirstUserMessageText = (messages: Message[]): string => {
    const userMsg = messages.find((message) => message.role === "user");
    if (!userMsg) {
      return "";
    }
    const content = userMsg.content;
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      const textBlock = content.find((block) => block.type === "text");
      if (textBlock?.text) {
        return textBlock.text as string;
      }
    }
    return "";
  };

  // cch = first 5 hex chars of SHA-256(firstUserText); used as a message fingerprint in the billing header.
  private computeContentChecksum = (messageText: string): string => {
    return createHash("sha256").update(messageText).digest("hex").slice(0, 5);
  };

  // Samples chars at indices 4, 7, 20 (pads "0" if too short), then SHA-256(salt+sampled+version).slice(0,3).
  private computeVersionSuffix = (
    messageText: string,
    version: string,
  ): string => {
    const sampled = [4, 7, 20]
      .map((index) => (index < messageText.length ? messageText[index] : "0"))
      .join("");
    const input = `${this.billingSalt}${sampled}${version}`;
    return createHash("sha256").update(input).digest("hex").slice(0, 3);
  };

  private prefixToolName = (name: string): string => {
    return `${this.toolPrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  };

  private unprefixToolName = (name: string): string => {
    if (!name.startsWith(this.toolPrefix)) {
      return name;
    }
    const stripped = name.slice(this.toolPrefix.length);
    return `${stripped.charAt(0).toLowerCase()}${stripped.slice(1)}`;
  };

  private stripToolPrefixFromText = (text: string): string => {
    const prefix = this.toolPrefix;
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(
      new RegExp(`"name"\\s*:\\s*"${escapedPrefix}([^"]+)"`, "g"),
      (_match, name: string) =>
        `"name": "${this.unprefixToolName(`${prefix}${name}`)}"`,
    );
  };

  // Orphaned tool_use/tool_result blocks (no matching counterpart) cause API 400s mid-conversation.
  private repairToolPairs = (messages: Message[]): Message[] => {
    // Step 1: collect all tool_use ids and tool_result tool_use_ids across the conversation.
    const toolUseIds = new Set<string>();
    const toolResultIds = new Set<string>();

    for (const message of messages) {
      if (!Array.isArray(message.content)) {
        continue;
      }

      for (const block of message.content) {
        const id = block["id"];
        if (block.type === "tool_use" && typeof id === "string") {
          toolUseIds.add(id);
        }
        const toolUseId = block["tool_use_id"];
        if (block.type === "tool_result" && typeof toolUseId === "string") {
          toolResultIds.add(toolUseId);
        }
      }
    }

    // Step 2: find ids that exist on one side but not the other.
    const orphanedUses = new Set<string>();
    for (const id of toolUseIds) {
      if (!toolResultIds.has(id)) {
        orphanedUses.add(id);
      }
    }
    const orphanedResults = new Set<string>();
    for (const id of toolResultIds) {
      if (!toolUseIds.has(id)) {
        orphanedResults.add(id);
      }
    }

    if (orphanedUses.size === 0 && orphanedResults.size === 0) {
      return messages;
    }

    // Step 3: strip orphaned blocks and drop messages that become empty.
    const repairedMessages = messages.map((message) => {
      if (!Array.isArray(message.content)) {
        return message;
      }
      const cleanedContent = message.content.filter((block) => {
        const id = block["id"];
        if (block.type === "tool_use" && typeof id === "string") {
          return !orphanedUses.has(id);
        }
        const toolUseId = block["tool_use_id"];
        if (block.type === "tool_result" && typeof toolUseId === "string") {
          return !orphanedResults.has(toolUseId);
        }
        return true;
      });
      return { ...message, content: cleanedContent };
    });

    return repairedMessages.filter(
      (message) =>
        !(Array.isArray(message.content) && message.content.length === 0),
    );
  };
}

const claudeCliTransport = new ClaudeCliTransport();
export { claudeCliTransport };
