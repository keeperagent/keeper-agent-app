import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentMailboxDB } from "@/electron/database/agentMailbox";
import { safeStringify } from "@/electron/appAgent/utils";
import type { ToolContext } from "@/electron/appAgent/toolContext";

const schema = z.object({
  includeAcknowledged: z
    .boolean()
    .optional()
    .describe(
      "If true, include already-acknowledged messages. Default false (only UNREAD and READ).",
    ),
});

export const readMessagesTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: "read_messages",
    description:
      "Read messages in your mailbox — direct messages and broadcasts. Returns unread messages by default. Call acknowledge_message after processing a message.",
    schema: schema as any,
    func: async ({
      includeAcknowledged,
    }: {
      includeAcknowledged?: boolean;
    }) => {
      const agentId = toolContext.agentProfileId;
      if (!agentId) {
        throw new Error("read_messages is only available for profile agents");
      }

      const [messages, err] = await agentMailboxDB.getMessagesForAgent(
        agentId,
        includeAcknowledged || false,
      );

      if (err) {
        throw new Error(`Failed to read messages: ${err?.message}`);
      }

      return safeStringify({ messages: messages || [] });
    },
  });
